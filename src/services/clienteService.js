import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// utils
import hashSenha from "../utils/hashSenha.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";
import gerarToken from "../utils/gerarToken.js";
import { verificarDuplicidade } from "../utils/verificarDuplicidade.js";
import { limparTelefone, juntarNomes, formatarTelefoneBR } from "../utils/formatador.js";

// Cadastro simples (presencial) feito pelo funcionario
export const cadastrorSimples = async (dadosCliente) => {
  const { nome, sobrenome } = dadosCliente;
  const telefone = limparTelefone(dadosCliente.telefone);
  const nomeCompleto = juntarNomes(nome, sobrenome);
  delete dadosCliente.sobrenome;

  if (!telefone) {
    throw new AppError("Telefone é obrigatório.", 400);
  }

  // Verifica se o telefone já existe
  await verificarDuplicidade("telefone", telefone, "cliente");

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: {
      ...dadosCliente,
      nome: nomeCompleto,
      telefone,
    },
  });

  // Formatar o telefone
  novoCliente.telefone = formatarTelefoneBR(telefone);

  return novoCliente;
};

// Cadastro completo (online)
export const cadastroCompleto = async (dadosCliente) => {
  const { email, senha, nome, sobrenome } = dadosCliente;
  const telefone = limparTelefone(dadosCliente.telefone);
  const nomeCompleto = juntarNomes(nome, sobrenome);
  delete dadosCliente.sobrenome;

  if (!email || !senha || !telefone) {
    throw new AppError("Email, senha e telefone são obrigatórios.", 400);
  }

  // Verifica duplicidades
  await verificarDuplicidade("telefone", telefone, "cliente");
  await verificarDuplicidade("email", email, "cliente");

  // Criptografa a senha
  const senhaCriptografada = await hashSenha(senha);

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: {
      ...dadosCliente,
      senha: senhaCriptografada,
      nome: nomeCompleto,
      telefone,
    },
  });

  // Gera o token
  const token = gerarToken(novoCliente);

  return token;
};

// login
export const login = async (dadosLogin) => {
  const { email, senha } = dadosLogin;

  if (!email || !senha) {
    throw new AppError("Email e senha são obrigatórios para fazer login.", 400);
  }

  const clienteAutenticado = await autenticarUsuario(dadosLogin, "cliente");
  if (!clienteAutenticado) {
    throw new AppError("Credenciais inválidas. Verifique os dados fornecidos.", 401);
  }

  const token = gerarToken(clienteAutenticado);

  return token;
};

// metodo para verificar se o cliente já tem conta presencial e transforma em online
export const cadastroPresencialParaOnline = async (dados) => {
  const { email, senha } = dados;
  const telefone = limparTelefone(dados.telefone);

  if (!email || !senha || !telefone) {
    throw new AppError("Todos os campos são obrigatórios.", 400);
  }

  // Verifica se o cliente já possui cadastro presencial
  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  if (!cliente) {
    throw new AppError("Cadastro não localizado. Verifique os dados fornecidos.", 404);
  }

  if (cliente.email || cliente.senha) {
    throw new AppError("Esse usuário já possui cadastro para uso online.", 400);
  }

  // Verifica se o email já está em uso por outro cliente
  await verificarDuplicidade("email", email, "cliente");

  // Criptografa a senha antes de salvar
  const senhaHash = await hashSenha(senha);

  // Atualiza o cliente com os dados online
  await prisma.cliente.update({
    where: { telefone },
    data: { email, senha: senhaHash },
  });
};

// Consultar os dados do cliente, metodo usado tanto pelo cliente e pelo funcionario
export const perfilDoCliente = async (id) => {
  if (!id) {
    throw new AppError("Id invalido, verifique o Id.", 400);
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      nome: true,
      telefone: true,
      logradouro: true,
      numero: true,
      bairro: true,
      cidade: true,
      estado: true,
      cep: true,
    },
  });
  if (!cliente) {
    throw new AppError("Usuário não localizado.", 404);
  }

  // Formatar o telefone
  cliente.telefone = formatarTelefoneBR(cliente.telefone);

  return cliente;
};

export const atualizaDadosPessoais = async (id, dadosNovos) => {
  const { nome, sobrenome, email, senhaAtual, senhaNova } = dadosNovos;
  const telefone = limparTelefone(dadosNovos.telefone);
  // const nomeCompleto = juntarNomes(nome, sobrenome);

  if (!id) {
    throw new AppError("Id invalido, verifique o Id.", 400);
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  const dadosAtualizados = {};

  if (nome?.trim() && sobrenome?.trim() && `${nome} ${sobrenome}`.toLowerCase() !== cliente.nome.toLowerCase()) {
    dadosAtualizados.nome = juntarNomes(nome, sobrenome);
  }

  if (email && email !== cliente.email) {
    await verificarDuplicidade("email", email, "cliente");
    dadosAtualizados.email = email;
  }

  if (telefone && telefone !== cliente.telefone) {
    await verificarDuplicidade("telefone", telefone, "cliente");
    dadosAtualizados.telefone = telefone;
  }

  if (senhaAtual && senhaNova) {
    if (senhaAtual === senhaNova) {
      throw new AppError("A senha nova não deve ser igual a atual", 400);
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, cliente.senha);
    if (!senhaCorreta) {
      throw new AppError("Senha atual incorreta", 401);
    }
    dadosAtualizados.senha = await hashSenha(senhaNova);
  }

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: { ...dadosAtualizados },
  });
};

export const atualizarEndereco = async (id, dadosNovos) => {
  const { logradouro, numero, bairro, cidade, estado, cep } = dadosNovos;

  if (!id) {
    throw new AppError("Id invalido, verifique o Id.", 400);
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  const novoEndereco = {};

  if (logradouro && logradouro !== cliente.logradouro) novoEndereco.logradouro = logradouro;
  if (numero && numero !== cliente.numero) novoEndereco.numero = numero;
  if (bairro && bairro !== cliente.bairro) novoEndereco.bairro = bairro;
  if (cidade && cidade !== cliente.cidade) novoEndereco.cidade = cidade;
  if (estado && estado !== cliente.estado) novoEndereco.estado = estado;
  if (cep && cep !== cliente.cep) novoEndereco.cep = cep;

  if (Object.keys(novoEndereco).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: { ...novoEndereco },
  });
};

export const atualizaClienteComFuncionario = async (id, dadosNovos) => {
  const { nome, sobrenome, logradouro, numero, bairro, cidade, estado, cep } = dadosNovos;
  const telefone = limparTelefone(dadosNovos.telefone);
  // const nomeCompleto = juntarNomes(nome, sobrenome);

  if (!id) {
    throw new AppError("Id invalido, verifique o Id.", 400);
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError("Cliente não encontrado.", 404);
  }

  const dadosAtualizados = {};

  if (nome?.trim() && sobrenome?.trim() && `${nome} ${sobrenome}`.toLowerCase() !== cliente.nome.toLowerCase()) {
    dadosAtualizados.nome = juntarNomes(nome, sobrenome);
  }

  if (telefone && telefone !== cliente.telefone) {
    await verificarDuplicidade("telefone", telefone, "cliente");
    dadosAtualizados.telefone = telefone;
  }

  if (logradouro && logradouro !== cliente.logradouro) dadosAtualizados.logradouro = logradouro;
  if (numero && numero !== cliente.numero) dadosAtualizados.numero = numero;
  if (bairro && bairro !== cliente.bairro) dadosAtualizados.bairro = bairro;
  if (cidade && cidade !== cliente.cidade) dadosAtualizados.cidade = cidade;
  if (estado && estado !== cliente.estado) dadosAtualizados.estado = estado;
  if (cep && cep !== cliente.cep) dadosAtualizados.cep = cep;

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  console.log(dadosAtualizados);

  await prisma.cliente.update({
    where: { id },
    data: {
      ...dadosAtualizados,
      telefone,
    },
  });
};
