import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import hashSenha from "../utils/hashSenha.js";

// método para cadastrar cliente, abordar o cadastro completo(online) e simples(presencial)
export const cadastrarCliente = async (dadosCliente, isCadastroCompleto = false) => {
  if (isCadastroCompleto) {
    // Valida email e senha para cadastro completo
    if (!dadosCliente.email || !dadosCliente.senha) {
      throw new Error("Email e senha são obrigatórios para cadastro completo.");
    }

    // Verifica se o e-mail já existe
    const emailExiste = await prisma.cliente.findUnique({ where: { email: dadosCliente.email } });
    if (emailExiste) {
      throw new Error("Já existe um usuário com esse email.");
    }

    // Criptografa a senha
    dadosCliente.senha = await hashSenha(dadosCliente.senha);
  }

  // Verifica se o telefone já existe (em ambos os casos)
  const telefoneExiste = await prisma.cliente.findUnique({ where: { telefone: dadosCliente.telefone } });
  if (telefoneExiste) {
    throw new Error("Já existe um usuário com esse telefone.");
  }

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: dadosCliente,
  });

  return novoCliente;
};
