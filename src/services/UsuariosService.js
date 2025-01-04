// Metodos genericos usados para todos os usuários
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

export const autenticarUsuario = async (dadosLogin, role) => {
  const usuario = await prisma[role].findUnique({ where: { email: dadosLogin.email } });
  if (!usuario) return null;

  const senhaValida = await bcrypt.compare(dadosLogin.senha, usuario.senha);
  if (!senhaValida) return null;

  return usuario;
};
