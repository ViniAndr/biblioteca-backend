import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import hashSenha from "../utils/hashSenha.js";
import { autenticarUsuario } from "./UsuariosService.js";
import AppError from "../utils/AppError.js";
import gerarToken from "../utils/gerarToken.js";

// métodos auxiliares para verificar duplicidades
async function verificarDuplicidadeEmail(email) {
  const emailExiste = await prisma.cliente.findUnique({ where: { email } });
  if (emailExiste) {
    throw new AppError("Esse email já está cadastrado.", 409);
  }
}

async function verificarDuplicidadeTelefone(telefone) {
  const telefoneExiste = await prisma.cliente.findUnique({ where: { telefone } });
  if (telefoneExiste) {
    throw new AppError("Esse telefone já está cadastrado.", 409);
  }
}

// Cadastro simples (presencial) feito pelo funcionario
export const cadastrorSimples = async (dadosCliente) => {
  const { telefone } = dadosCliente;

  if (!telefone) {
    throw new AppError("Telefone é obrigatório.", 400);
  }

  // Verifica se o telefone já existe
  await verificarDuplicidadeTelefone(telefone);

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: dadosCliente,
  });

  return novoCliente;
};

// Cadastro completo (online)
export const cadastroCompleto = async (dadosCliente) => {
  const { email, senha, telefone } = dadosCliente;

  if (!email || !senha || !telefone) {
    throw new AppError("Email, senha e telefone são obrigatórios.", 400);
  }

  // Verifica duplicidades
  await verificarDuplicidadeTelefone(telefone);
  await verificarDuplicidadeEmail(email);

  // Criptografa a senha
  const senhaCriptografada = await hashSenha(senha);

  // Cria o novo cliente
  const novoCliente = await prisma.cliente.create({
    data: { ...dadosCliente, senha: senhaCriptografada },
  });

  // Gera o token
  const token = gerarToken(novoCliente);

  return token;
};

// login
export const login = async (dadosLogin) => {
  const { email, senha } = dadosLogin;

  if (!email || !senha) {
    throw new AppError("Email e senha são obrigatórios para fazer login.", 400);
  }

  const clienteAutenticado = await autenticarUsuario(dadosLogin, "cliente");
  if (!clienteAutenticado) {
    throw new AppError("Credenciais inválidas. Verifique os dados fornecidos.", 401);
  }

  const token = gerarToken(clienteAutenticado);

  return token;
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
    throw new AppError("Esse usuário já possui cadastro para uso online.", 400);
  }

  // Verifica se o email já está em uso por outro cliente
  await verificarDuplicidadeEmail(email);

  // Criptografa a senha antes de salvar
  const senhaHash = await hashSenha(senha);

  // Atualiza o cliente com os dados online
  const clienteAtualizadoParaOnline = await prisma.cliente.update({
    where: { telefone },
    data: { email, senha: senhaHash },
  });

  return clienteAtualizadoParaOnline;
};

export const perfilDoCliente = async (id) => {
  if (!id) {
    throw new AppError("Id invalido, verifique o Id.", 400);
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      nome: true,
      sobrenome: true,
      telefone: true,
      logradouro: true,
      numero: true,
      bairro: true,
      cidade: true,
      estado: true,
      cep: true,
    },
  });
  if (!cliente) {
    throw new AppError("Usuário não localizado.", 404);
  }

  return cliente;
};
