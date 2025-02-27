import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Utils
import hashSenha from "../utils/hashSenha.js";
import { validarEmail, validarSenha, validarNome } from "../utils/validacao.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";
import gerarToken from "../utils/gerarToken.js";
import { juntarNomes } from "../utils/formatador.js";
import verificarDuplicidade from "../utils/verificarDuplicidade.js";

export const cadastrar = async (senhaAdmin) => {
  const admin = await prisma.admin.findFirst({ select: { senha: true } });
  if (!admin) {
    throw new AppError("Administrador não encontrado.", 404);
  }

  const senhaValida = await bcrypt.compare(senhaAdmin.senha, admin.senha);
  if (!senhaValida) {
    throw new AppError("Senha do administrador incorreta.", 403);
  }

  // Pega o último funcionário cadastrado
  const ultimoFuncionario = await prisma.funcionario.findFirst({
    orderBy: { id: "desc" }, // Ordena pelo último ID inserido
  });

  // Define um número incremental baseado no último ID encontrado
  const numeroFuncionario = ultimoFuncionario ? ultimoFuncionario.id + 1 : 1;

  const nome = `funcionario${numeroFuncionario}`;
  const email = `funcionario${numeroFuncionario}@biblioteca.com`;
  const senhaAleatoria = `${Math.floor(100000 + Math.random() * 900000)}CP`;
  const senha = await hashSenha(senhaAleatoria);

  await prisma.funcionario.create({
    data: {
      nome,
      email,
      senha,
    },
  });

  return {
    email,
    senha: senhaAleatoria,
  };
};

export const login = async (dados) => {
  const { email, senha } = dados;
  // Validações
  validarEmail(email);
  validarSenha(senha);

  const funcionarioAutenticado = await autenticarUsuario(dados, "funcionario");
  if (!funcionarioAutenticado) {
    throw new AppError("Credenciais inválidas. Verifique os dados fornecidos.", 401);
  }

  const token = gerarToken(funcionarioAutenticado);
  return token;
};

export const obterPerfil = async (id) => {
  // Id já vem validado pelo req ou pelo Middleware
  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    select: {
      nome: true,
      email: true,
    },
  });
  if (!funcionario) throw new AppError("Funcionário não localizado.", 404);

  return funcionario;
};

export const atualizarDados = async (id, dados) => {
  // Id já vem validado pelo req
  const { nome, sobrenome, email, senhaAtual, senhaNova } = dados;

  const dadosNovos = {};

  const funcionario = await prisma.funcionario.findUnique({ where: { id } });
  if (!funcionario) {
    throw new AppError("Usuário não localizado.", 404);
  }

  if (nome?.trim() && sobrenome?.trim() && `${nome} ${sobrenome}`.toLowerCase() !== cliente.nome.toLowerCase()) {
    validarNome(nome);
    validarNome(sobrenome);
    dadosNovos.nome = juntarNomes(nome, sobrenome);
  }

  if (email && email !== funcionario.email) {
    validarEmail(email);
    await verificarDuplicidade("email", email, "funcionario", prisma);
    dadosNovos.email = email;
  }

  if (senhaAtual && senhaNova) {
    if (senhaAtual === senhaNova) {
      throw new AppError("A senha nova não deve ser igual a atual", 400);
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, funcionario.senha);
    if (!senhaCorreta) {
      throw new AppError("Senha atual incorreta", 401);
    }
    validarSenha(senhaNova);
    dadosNovos.senha = await hashSenha(senhaNova);
  }

  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  return await prisma.funcionario.update({
    where: { id },
    data: { ...dadosNovos },
    select: {
      nome: true,
      email: true,
    },
  });
};

export const obterFuncionarios = async (pagina = 1, nome, qtdItensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }

  const funcionarios = await prisma.funcionario.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
    },
    // take = pega tal quantidade de itens do BD
    take: Number(qtdItensPorPagina),
    // skip = serve para "pular" itens já trazidos em páginas anteriores
    skip: (Number(pagina) - 1) * Number(qtdItensPorPagina),
  });
  // Diz o total de itens encontrados
  const contador = await prisma.funcionario.count({ where });

  return {
    funcionarios,
    qtdTotalDePaginas: Math.ceil(contador / qtdItensPorPagina),
    paginaAtual: Number(pagina),
  };
};
