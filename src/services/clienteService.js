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

// CLIENTE ATUALIZANDO O PRÓPRIO PERFIL
export const atualizarPerfilCliente = async (id, dadosNovos) => {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 404);

  const dadosAtualizados = {};

  // NOME E SOBRENOME
  if (dadosNovos.nome && dadosNovos.sobrenome) {
    const nomeCompleto = juntarNomes(dadosNovos.nome, dadosNovos.sobrenome);
    if (nomeCompleto.toLowerCase() !== cliente.nome.toLowerCase()) {
      validacao.validarNome(dadosNovos.nome);
      validacao.validarNome(dadosNovos.sobrenome);
      dadosAtualizados.nome = nomeCompleto;
    }
  }

  // EMAIL
  if (dadosNovos.email && dadosNovos.email !== cliente.email) {
    validacao.validarEmail(dadosNovos.email);
    await verificarDuplicidade("email", dadosNovos.email, "cliente", prisma);
    dadosAtualizados.email = dadosNovos.email;
  }

  // TELEFONE
  if (dadosNovos.telefone) {
    const telefoneLimpo = limparNumeros(dadosNovos.telefone);
    if (telefoneLimpo !== cliente.telefone) {
      validacao.validarTelefone(telefoneLimpo);
      await verificarDuplicidade("telefone", telefoneLimpo, "cliente", prisma);
      dadosAtualizados.telefone = telefoneLimpo;
    }
  }

  // SENHA (Só altera se mandou a nova, e exige a atual!)
  if (dadosNovos.senhaNova) {
    if (!dadosNovos.senhaAtual) throw new AppError("Senha atual é obrigatória para alterar a senha.", 400);
    if (dadosNovos.senhaAtual === dadosNovos.senhaNova)
      throw new AppError("A senha nova não deve ser igual a atual.", 400);

    const senhaCorreta = await bcrypt.compare(dadosNovos.senhaAtual, cliente.senha);
    if (!senhaCorreta) throw new AppError("Senha atual incorreta.", 401);

    validacao.validarSenha(dadosNovos.senhaNova);
    dadosAtualizados.senha = await hashSenha(dadosNovos.senhaNova);
  }

  // ENDEREÇO (Verificação inteligente em bloco)
  const camposEndereco = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"];
  camposEndereco.forEach((campo) => {
    if (dadosNovos[campo] && dadosNovos[campo] !== cliente[campo]) {
      dadosAtualizados[campo] = dadosNovos[campo];
    }
  });

  if (dadosAtualizados.estado) validacao.validarEstado(dadosAtualizados.estado);
  if (dadosAtualizados.cep) validacao.validarCEP(dadosAtualizados.cep);

  // Se não mudou absolutamente nada, avisa
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

  const dadosAtualizados = {};

  // NOME E SOBRENOME
  if (dadosNovos.nome && dadosNovos.sobrenome) {
    const nomeCompleto = juntarNomes(dadosNovos.nome, dadosNovos.sobrenome);
    if (nomeCompleto.toLowerCase() !== cliente.nome.toLowerCase()) {
      validacao.validarNome(dadosNovos.nome);
      validacao.validarNome(dadosNovos.sobrenome);
      dadosAtualizados.nome = nomeCompleto;
    }
  }

  // EMAIL (Permitido para ajudar o cliente que esqueceu)
  if (dadosNovos.email && dadosNovos.email !== cliente.email) {
    validacao.validarEmail(dadosNovos.email);
    await verificarDuplicidade("email", dadosNovos.email, "cliente", prisma);
    dadosAtualizados.email = dadosNovos.email;
  }

  // TELEFONE
  if (dadosNovos.telefone) {
    const telefoneLimpo = limparNumeros(dadosNovos.telefone);
    if (telefoneLimpo !== cliente.telefone) {
      validacao.validarTelefone(telefoneLimpo);
      await verificarDuplicidade("telefone", telefoneLimpo, "cliente", prisma);
      dadosAtualizados.telefone = telefoneLimpo;
    }
  }

  // ENDEREÇO
  const camposEndereco = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"];
  camposEndereco.forEach((campo) => {
    if (dadosNovos[campo] && dadosNovos[campo] !== cliente[campo]) {
      dadosAtualizados[campo] = dadosNovos[campo];
    }
  });

  if (dadosAtualizados.estado) validacao.validarEstado(dadosAtualizados.estado);
  if (dadosAtualizados.cep) validacao.validarCEP(dadosAtualizados.cep);

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: dadosAtualizados,
  });
};

export const verTodosClientes = async (pagina = 1, nome, itensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
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
      // take = pega tal quantidade de itens do BD
      take: Number(itensPorPagina),
      // skip = serve para "pular" itens já trazidos em páginas anteriores
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
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
    qtdTotalDePaginas: contador > 0 ? Math.ceil(contador / itensPorPagina) : 1,
    paginaAtual: Number(pagina),
    total: contador,
  };
};
