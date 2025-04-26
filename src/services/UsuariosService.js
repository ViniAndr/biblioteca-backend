// Metodos genericos usados para todos os usuários
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

export const autenticarUsuario = async (dadosLogin, role) => {
  const where = { email: dadosLogin.email };

  // só faça login para o funcionario se for ativo
  if (role === "funcionario") where.ativo = true;

  const usuario = await prisma[role].findUnique({ where });
  if (!usuario) return null;

  const senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senha);
  if (!senhaValida) return null;

  return usuario;
};
