import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import hashSenha from "../utils/hashSenha.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";

// método para cadastrar cliente, abordar o cadastro completo(online) e simples(presencial)
export const cadastrarCliente = async (dadosCliente, isCadastroCompleto = false) => {
  if (isCadastroCompleto) {
    // Valida email e senha para cadastro completo
    if (!dadosCliente.email || !dadosCliente.senha) {
      throw new AppError("Email e senha são obrigatórios para cadastro completo.", 400);
    }

    // Verifica se o e-mail já existe
    const emailExiste = await prisma.cliente.findUnique({ where: { email: dadosCliente.email } });
    if (emailExiste) {
      throw new AppError("Já existe um usuário com esse email.", 409);
    }

    // Criptografa a senha
    dadosCliente.senha = await hashSenha(dadosCliente.senha);
  }

  // Verifica se o telefone já existe (em ambos os casos)
  const telefoneExiste = await prisma.cliente.findUnique({ where: { telefone: dadosCliente.telefone } });
  if (telefoneExiste) {
    throw new AppError("Já existe um usuário com esse telefone.", 409);
  }

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: dadosCliente,
  });

  return novoCliente;
};

// login
export const login = async (dadosLogin) => {
  if (!dadosLogin.email || !dadosLogin.senha) {
    throw new AppError("Email e senha são obrigatórios para fazer login.", 400);
  }

  const clienteAutenticado = await autenticarUsuario(dadosLogin, "cliente");
  if (!clienteAutenticado) {
    throw new AppError("Credencial invalida. Verifique os dados fornecidos.", 401);
  }

  return clienteAutenticado;
};

// metodo paa verificar se o cliente já tem conta presencial e transforma em online
export const cadastroPresencialParaOnline = async (dados) => {
  const { email, senha, telefone } = dados;

  if (!email || !senha || !telefone) {
    throw new AppError("Todos os campos são obrigatórios.", 400);
  }

  // Verifica se o cliente já possui cadastro presencial
  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  if (!cliente) {
    throw new AppError("Cadastro não localizado. Verifique os dados fornecidos.", 404);
  }

  if (cliente.email || cliente.senha) {
    throw new AppError("Esse cliente já possui cadastro para uso online.", 400);
  }

  // Verifica se o email já está em uso por outro cliente
  const checarEmail = await prisma.cliente.findFirst({ where: { email } });
  if (checarEmail) {
    throw new AppError("Esse email já está em uso.", 409);
  }

  // Criptografa a senha antes de salvar
  const senhaHash = await hashSenha(senha);

  // Atualiza o cliente com os dados online
  const clienteAtualizadoParaOnline = await prisma.cliente.update({
    where: { telefone },
    data: { email, senha: senhaHash },
  });

  return clienteAtualizadoParaOnline;
};
