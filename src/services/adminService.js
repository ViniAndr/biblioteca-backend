import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// utils
import AppError from "../utils/AppError.js";
import hashSenha from "../utils/hashSenha.js";
import gerarToken from "../utils/gerarToken.js";
import { validarEmail, validarSenha } from "../utils/validacao.js";
import { autenticarUsuario } from "./UsuariosService.js";
import { MENSAGENS_ERRO } from "../utils/constants.js";

// criação feita apenas 1 vez!!!
export const cadastrar = async () => {
  const nome = "Administrador"; // validado
  const email = "admin@biblioteca.com"; // validado
  const senha = await hashSenha("biblioteca123"); // validado

  // Verifico se já existe alguma conta antes de criar.
  const existeConta = await prisma.admin.count();
  if (existeConta !== 0) {
    throw new AppError("Uma conta administradora já foi criada, faça login", 400);
  }
  await prisma.admin.create({ data: { nome, email, senha } });
};

export const login = async (dadosLogin) => {
  // Validações
  validarEmail(dadosLogin.email);
  validarSenha(dadosLogin.senha);

  const adminAutenticado = await autenticarUsuario(dadosLogin, "admin");
  if (!adminAutenticado) {
    throw new AppError(MENSAGENS_ERRO.CREDENCIAIS_INVALIDAS, 401);
  }

  const token = gerarToken(adminAutenticado);
  return token;
};

export const obterPerfil = async (id) => {
  // Id já vem validado pelo req

  return await prisma.admin.findUnique({
    where: { id },
    select: {
      nome: true,
      email: true,
    },
  });
};

export const atualizarDados = async (id, dadosNovos) => {
  // Id já vem validado pelo req
  const { email, senhaAtual, senhaNova } = dadosNovos;
  const emailPadrao = "admin@biblioteca.com"; // validado
  const senhaPadrao = "biblioteca123"; // validado

  if (email === emailPadrao || senhaNova === senhaPadrao) {
    throw new AppError("Suas credenciais não podem ser iguais ao padrão do sistema", 400);
  }

  const dadosAtualizados = {};

  const admin = await prisma.admin.findUnique({ where: { id } });

  if (email && email !== admin.email) {
    validarEmail(email);
    dadosAtualizados.email = email;
  }

  if (senhaAtual && senhaNova) {
    if (senhaAtual === senhaNova) {
      throw new AppError("A senha nova não deve ser igual a atual", 400);
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, admin.senha);
    if (!senhaCorreta) {
      throw new AppError("Senha atual incorreta", 401);
    }
    validarSenha(senhaNova);
    dadosAtualizados.senha = await hashSenha(senhaNova);
  }

  if (Object.keys(dadosAtualizados).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma.admin.update({ where: { id }, data: dadosAtualizados });
};

export const resetarDados = async (id) => {
  // Id já vem validado pelo req
  const email = "admin@biblioteca.com"; // validado
  const senha = await hashSenha("biblioteca123"); // validado

  await prisma.admin.update({
    where: { id },
    data: { email, senha },
  });
};
