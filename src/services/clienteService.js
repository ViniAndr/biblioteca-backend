import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// utils
import hashSenha from "../utils/hashSenha.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";
import gerarToken from "../utils/gerarToken.js";
import verificarDuplicidade from "../utils/verificarDuplicidade.js";
import { limparNumeros, juntarNomes, formatarTelefoneBR, formatarNomeProprio } from "../utils/formatador.js";
import * as validacao from "../utils/validacao.js";
import { MENSAGENS_ERRO } from "../utils/constants.js";

// Cadastro simples (presencial) feito pelo funcionario
export const cadastroSimples = async (dadosCliente) => {
  // Tratamento e Padronização de Dados
  const nome = formatarNomeProprio(dadosCliente.nome);
  const sobrenome = formatarNomeProprio(dadosCliente.sobrenome);
  const telefone = limparNumeros(dadosCliente.telefone);

  // Padronização de Endereço
  dadosCliente.numero = dadosCliente.numero?.trim() ? dadosCliente.numero : "S/N";
  if (dadosCliente.logradouro) dadosCliente.logradouro = formatarNomeProprio(dadosCliente.logradouro);
  if (dadosCliente.bairro) dadosCliente.bairro = formatarNomeProprio(dadosCliente.bairro);
  if (dadosCliente.cidade) dadosCliente.cidade = formatarNomeProprio(dadosCliente.cidade);

  if (!dadosCliente.email || dadosCliente.email.trim() === "") {
    delete dadosCliente.email;
  }

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
  // 1. Tratamento e Padronização de Dados
  const email = dadosCliente.email;
  const senha = dadosCliente.senha;
  const nome = formatarNomeProprio(dadosCliente.nome);
  const sobrenome = formatarNomeProprio(dadosCliente.sobrenome);
  const telefone = limparNumeros(dadosCliente.telefone);

  // Padronização de Endereço
  dadosCliente.numero = dadosCliente.numero?.trim() ? dadosCliente.numero : "S/N";
  if (dadosCliente.logradouro) dadosCliente.logradouro = formatarNomeProprio(dadosCliente.logradouro);
  if (dadosCliente.bairro) dadosCliente.bairro = formatarNomeProprio(dadosCliente.bairro);
  if (dadosCliente.cidade) dadosCliente.cidade = formatarNomeProprio(dadosCliente.cidade);

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

export const login = async (dadosLogin) => {
  const { email, senha } = dadosLogin;

  validacao.validarEmail(email);
  validacao.validarSenha(senha);

  const clienteAutenticado = await autenticarUsuario(dadosLogin, "cliente");
  if (!clienteAutenticado) {
    throw new AppError(MENSAGENS_ERRO.CREDENCIAIS_INVALIDAS, 401);
  }

  const token = gerarToken(clienteAutenticado);
  return token;
};

export const migrarContaPresencialParaOnline = async (dados) => {
  const { email, senha } = dados;
  const telefone = limparNumeros(dados.telefone);

  validacao.validarTelefone(telefone);
  validacao.validarEmail(email);
  validacao.validarSenha(senha);

  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  if (!cliente) {
    throw new AppError("Cadastro não localizado. Verifique os dados fornecidos.", 404);
  }

  if (cliente.email && cliente.senha) {
    throw new AppError("Esse usuário já possui cadastro para uso online.", 400);
  }

  await verificarDuplicidade("email", email, "cliente", prisma);

  const senhaHash = await hashSenha(senha);

  await prisma.cliente.update({
    where: { telefone },
    data: { email, senha: senhaHash },
  });
};

export const obterPerfil = async (id) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      nome: true,
      telefone: true,
      email: true,
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

// FUNÇÃO AUXILIAR PARA ATUALIZAÇÃO (Evita código duplicado)
const prepararDadosAtualizacao = async (clienteAtual, dadosNovos) => {
  const dadosAtualizados = {};

  // NOME E SOBRENOME
  if (dadosNovos.nome) {
    const nome = formatarNomeProprio(dadosNovos.nome);

    if (nome.toLowerCase() !== clienteAtual.nome.toLowerCase()) {
      validacao.validarNome(nome);
      dadosAtualizados.nome = nome;
    }
  }

  // EMAIL
  if (dadosNovos.email && dadosNovos.email !== clienteAtual.email) {
    validacao.validarEmail(dadosNovos.email);
    await verificarDuplicidade("email", dadosNovos.email, "cliente", prisma);
    dadosAtualizados.email = dadosNovos.email;
  }

  // TELEFONE
  if (dadosNovos.telefone) {
    const telefoneLimpo = limparNumeros(dadosNovos.telefone);
    if (telefoneLimpo !== clienteAtual.telefone) {
      validacao.validarTelefone(telefoneLimpo);
      await verificarDuplicidade("telefone", telefoneLimpo, "cliente", prisma);
      dadosAtualizados.telefone = telefoneLimpo;
    }
  }

  // ENDEREÇO (Com formatação em bloco)
  if (dadosNovos.numero !== undefined) {
    dadosNovos.numero = dadosNovos.numero.trim() ? dadosNovos.numero : "S/N";
  }

  const camposEndereco = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"];
  camposEndereco.forEach((campo) => {
    if (dadosNovos[campo] && dadosNovos[campo] !== clienteAtual[campo]) {
      // Aplica Title Case apenas em campos de texto extenso
      if (["logradouro", "bairro", "cidade"].includes(campo)) {
        dadosAtualizados[campo] = formatarNomeProprio(dadosNovos[campo]);
      } else {
        dadosAtualizados[campo] = dadosNovos[campo];
      }
    }
  });

  if (dadosAtualizados.estado) validacao.validarEstado(dadosAtualizados.estado);
  if (dadosAtualizados.cep) validacao.validarCEP(dadosAtualizados.cep);

  return dadosAtualizados;
};

// CLIENTE ATUALIZANDO O PRÓPRIO PERFIL
export const atualizarPerfilCliente = async (id, dadosNovos) => {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);

  // Usa a função auxiliar para processar os dados básicos
  const dadosAtualizados = await prepararDadosAtualizacao(cliente, dadosNovos);

  // SENHA (Regra exclusiva do cliente: Só altera se mandou a nova, e exige a atual!)
  if (dadosNovos.senhaNova) {
    if (!dadosNovos.senhaAtual) throw new AppError("Senha atual é obrigatória para alterar a senha.", 400);
    if (dadosNovos.senhaAtual === dadosNovos.senhaNova)
      throw new AppError("A senha nova não deve ser igual a atual.", 400);

    const senhaCorreta = await bcrypt.compare(dadosNovos.senhaAtual, cliente.senha);
    if (!senhaCorreta) throw new AppError("Senha atual incorreta.", 401);

    validacao.validarSenha(dadosNovos.senhaNova);
    dadosAtualizados.senha = await hashSenha(dadosNovos.senhaNova);
  }

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: dadosAtualizados,
  });
};

// FUNCIONÁRIO ATUALIZANDO O CLIENTE
export const atualizarClientePeloFuncionario = async (id, dadosNovos) => {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);

  // Usa a função auxiliar (Funcionário não atualiza senha por aqui, então é só isso)
  const dadosAtualizados = await prepararDadosAtualizacao(cliente, dadosNovos);

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: dadosAtualizados,
  });
};

// Ver Todos (Mantido inalterado)
export const verTodosClientes = async (pagina = 1, nome, itensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome,
      mode: "insensitive",
    };
  }

  const [clientes, contador] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
      take: Number(itensPorPagina),
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),
    prisma.cliente.count({ where }),
  ]);

  const clientesFormatados = clientes.map((cliente) => ({
    ...cliente,
    telefone: formatarTelefoneBR(cliente.telefone),
  }));

  return {
    clientes: clientesFormatados,
    qtdTotalDePaginas: contador > 0 ? Math.ceil(contador / itensPorPagina) : 1,
    paginaAtual: Number(pagina),
    total: contador,
  };
};
