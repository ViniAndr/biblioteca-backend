import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// utils
import AppError from "../utils/AppError.js";
import hashSenha from "../utils/hashSenha.js";

// criação feita apenas 1 vez!!!
export const criarContaPadrao = async () => {
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
