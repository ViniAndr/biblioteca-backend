import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// utils
import hashSenha from "../utils/hashSenha.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";
import gerarToken from "../utils/gerarToken.js";
import verificarDuplicidade from "../utils/verificarDuplicidade.js";
import { limparNumeros, juntarNomes, formatarTelefoneBR } from "../utils/formatador.js";
import * as validacao from "../utils/validacao.js";
import { MENSAGENS_ERRO } from "../utils/constants.js";

// Cadastro simples (presencial) feito pelo funcionario
export const cadastrorSimples = async (dadosCliente) => {
  const { nome, sobrenome } = dadosCliente;
  const telefone = limparNumeros(dadosCliente.telefone);

  // Validações
  validacao.validarTelefone(telefone);
  validacao.validarNome(nome);
  validacao.validarNome(sobrenome);
  validacao.validarEndereco(dadosCliente);
  const nomeCompleto = juntarNomes(nome, sobrenome);
  delete dadosCliente.sobrenome;

  // Verifica se o telefone já existe
  await verificarDuplicidade("telefone", telefone, "cliente", prisma);

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: {
      ...dadosCliente,
      nome: nomeCompleto,
      telefone,
    },
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

  return {
    ...novoCliente,
    telefone: formatarTelefoneBR(novoCliente.telefone),
  };
};

// Cadastro completo (online)
export const cadastroCompleto = async (dadosCliente) => {
  const { email, senha, nome, sobrenome } = dadosCliente;
  const telefone = limparNumeros(dadosCliente.telefone);

  // Validações
  validacao.validarNome(nome);
  validacao.validarNome(sobrenome);
  validacao.validarTelefone(telefone);
  validacao.validarEmail(email);
  validacao.validarSenha(senha);
  validacao.validarEndereco(dadosCliente);
  const nomeCompleto = juntarNomes(nome, sobrenome);
  delete dadosCliente.sobrenome;

  // Verifica duplicidades
  await Promise.all([
    verificarDuplicidade("telefone", telefone, "cliente", prisma),
    verificarDuplicidade("email", email, "cliente", prisma),
  ]);

  // Criptografa a senha
  const senhaCriptografada = await hashSenha(senha.trim());

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

  // Validações
  validacao.validarEmail(email);
  validacao.validarSenha(senha);

  const clienteAutenticado = await autenticarUsuario(dadosLogin, "cliente");
  if (!clienteAutenticado) {
    throw new AppError(MENSAGENS_ERRO.CREDENCIAIS_INVALIDAS, 401);
  }

  const token = gerarToken(clienteAutenticado);
  return token;
};

// metodo para verificar se o cliente já tem conta presencial e transforma em online
export const migrarContaPresencialParaOnline = async (dados) => {
  const { email, senha } = dados;
  const telefone = limparNumeros(dados.telefone);

  // Validações
  validacao.validarTelefone(telefone);
  validacao.validarEmail(email);
  validacao.validarSenha(senha);

  // Verifica se o cliente já possui cadastro presencial
  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  if (!cliente) {
    throw new AppError("Cadastro não localizado. Verifique os dados fornecidos.", 404);
  }

  if (cliente.email && cliente.senha) {
    throw new AppError("Esse usuário já possui cadastro para uso online.", 400);
  }

  // Verifica se o email já está em uso por outro cliente
  await verificarDuplicidade("email", email, "cliente", prisma);

  // Criptografa a senha antes de salvar
  const senhaHash = await hashSenha(senha);

  // Atualiza o cliente com os dados online
  await prisma.cliente.update({
    where: { telefone },
    data: { email, senha: senhaHash },
  });
};

// Consultar os dados do cliente, metodo usado tanto pelo cliente e pelo funcionario
export const obterPerfil = async (id) => {
  // Id já vem validado do req(cliente) e por middleware(funcionario)
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
    throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);
  }

  return {
    ...cliente,
    telefone: formatarTelefoneBR(cliente.telefone),
  };
};

export const atualizarDadosPessoais = async (id, dadosNovos) => {
  // Id já vem validado do req
  const { nome, sobrenome, email, senhaAtual, senhaNova } = dadosNovos;
  const telefone = limparNumeros(dadosNovos.telefone);

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);
  }

  const dadosAtualizados = {};

  if (nome?.trim() && sobrenome?.trim() && `${nome} ${sobrenome}`.toLowerCase() !== cliente.nome.toLowerCase()) {
    validacao.validarNome(nome);
    validacao.validarNome(sobrenome);
    dadosAtualizados.nome = juntarNomes(nome, sobrenome);
  }

  if (email && email !== cliente.email) {
    validacao.validarEmail(email);
    await verificarDuplicidade("email", email, "cliente", prisma);
    dadosAtualizados.email = email;
  }

  if (telefone && telefone !== cliente.telefone) {
    validacao.validarTelefone(telefone);
    await verificarDuplicidade("telefone", telefone, "cliente", prisma);
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
    validacao.validarSenha(senhaNova);
    dadosAtualizados.senha = await hashSenha(senhaNova);
  }

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: { ...dadosAtualizados },
  });
};

export const atualizarEndereco = async (id, dadosNovos) => {
  // Id já vem validado do req
  const { logradouro, numero, bairro, cidade, estado, cep } = dadosNovos;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);
  }

  const novoEndereco = {};

  if (logradouro && logradouro !== cliente.logradouro) novoEndereco.logradouro = logradouro;
  if (numero && numero !== cliente.numero) novoEndereco.numero = numero;
  if (bairro && bairro !== cliente.bairro) novoEndereco.bairro = bairro;
  if (cidade && cidade !== cliente.cidade) novoEndereco.cidade = cidade;
  if (estado && estado !== cliente.estado) {
    validacao.validarEstado(estado);
    novoEndereco.estado = estado;
  }
  if (cep && cep !== cliente.cep) {
    validacao.validarCEP(cep);
    novoEndereco.cep = cep;
  }

  if (Object.keys(novoEndereco).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: { ...novoEndereco },
  });
};

export const atualizaClienteComFuncionario = async (id, dadosNovos) => {
  // Id já vem validado por middleware
  const { nome, sobrenome, logradouro, numero, bairro, cidade, estado, cep } = dadosNovos;
  const telefone = limparNumeros(dadosNovos.telefone);

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);
  }

  const dadosAtualizados = {};

  if (nome?.trim() && sobrenome?.trim() && `${nome} ${sobrenome}`.toLowerCase() !== cliente.nome.toLowerCase()) {
    validacao.validarNome(nome);
    validacao.validarNome(sobrenome);
    dadosAtualizados.nome = juntarNomes(nome, sobrenome);
  }

  if (telefone && telefone !== cliente.telefone) {
    validacao.validarTelefone(telefone);
    await verificarDuplicidade("telefone", telefone, "cliente", prisma);
    dadosAtualizados.telefone = telefone;
  }

  if (logradouro && logradouro !== cliente.logradouro) dadosAtualizados.logradouro = logradouro;
  if (numero && numero !== cliente.numero) dadosAtualizados.numero = numero;
  if (bairro && bairro !== cliente.bairro) dadosAtualizados.bairro = bairro;
  if (cidade && cidade !== cliente.cidade) dadosAtualizados.cidade = cidade;
  if (estado && estado !== cliente.estado) {
    validacao.validarEstado(estado);
    dadosAtualizados.estado = estado;
  }
  if (cep && cep !== cliente.cep) {
    validacao.validarCEP(cep);
    dadosAtualizados.cep = cep;
  }

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      ...dadosAtualizados,
      telefone,
    },
  });
};

export const verTodosClientes = async (pagina = 1, nome, qtdItensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }

  const [clientes, contador] = await Promise.all([
    prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
      // take = pega tal quantidade de itens do BD
      take: Number(qtdItensPorPagina),
      // skip = serve para "pular" itens já trazidos em páginas anteriores
      skip: (Number(pagina) - 1) * Number(qtdItensPorPagina),
    }),

    // Diz o total de itens encontrados
    prisma.cliente.count({ where }),
  ]);

  // Aplicando a formatação no telefone de cada cliente
  const clientesFormatados = clientes.map((cliente) => ({
    ...cliente,
    telefone: formatarTelefoneBR(cliente.telefone),
  }));

  return {
    clientes: clientesFormatados,
    qtdTotalDePaginas: Math.ceil(contador / qtdItensPorPagina),
    paginaAtual: Number(pagina),
    total: contador,
  };
};
