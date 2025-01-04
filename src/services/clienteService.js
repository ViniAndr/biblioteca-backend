import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import hashSenha from "../utils/hashSenha.js";

export const cadastroCompleto = async (dadosCliente) => {
  // Verifica se o e-mail já existe
  const emailExiste = await prisma.cliente.findUnique({ where: { email: dadosCliente.email } });
  if (emailExiste) {
    throw new Error("Já existe um usuário com esse email.");
  }

  // Verifica se o telefone já existe
  const telefoneExiste = await prisma.cliente.findUnique({ where: { telefone: dadosCliente.telefone } });
  if (telefoneExiste) {
    throw new Error("Já existe um usuário com esse telefone.");
  }

  // criptografar a senha do cliente
  dadosCliente.senha = await hashSenha(dadosCliente.senha);

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: dadosCliente,
  });

  return novoCliente;
};
