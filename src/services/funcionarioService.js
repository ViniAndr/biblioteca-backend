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
  validarSenha(senhaAdmin);
  const admin = await prisma.admin.findFirst({ select: { senha: true } });
  if (!admin) {
    throw new AppError("Administrador não encontrado.", 404);
  }

  const senhaValida = await bcrypt.compare(senhaAdmin, admin.senha);
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
  const { nome, email, senhaAtual, senhaNova } = dados;

  const dadosNovos = {};

  const funcionario = await prisma.funcionario.findUnique({ where: { id } });
  if (!funcionario) {
    throw new AppError("Usuário não localizado.", 404);
  }

  if (nome && nome.trim() && nome.trim().toLowerCase() !== funcionario.nome.toLowerCase()) {
    validarNome(nome);
    dadosNovos.nome = nome.trim();
  }

  if (email && email.trim() !== funcionario.email) {
    validarEmail(email);
    await verificarDuplicidade("email", email, "funcionario", prisma);
    dadosNovos.email = email.trim();
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

  // Se o usuário clicou em salvar sem mudar nada
  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError("Nenhum dado válido fornecido para atualização.", 400);
  }

  return await prisma.funcionario.update({
    where: { id },
    data: dadosNovos,
    select: {
      nome: true,
      email: true,
    },
  });
};

export const obterFuncionarios = async (pagina = 1, nome, itensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }

  const [funcionarios, contador] = await prisma.$transaction([
    prisma.funcionario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
      },
      // take = pega tal quantidade de itens do BD
      take: Number(itensPorPagina),
      // skip = serve para "pular" itens já trazidos em páginas anteriores
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),
    // Diz o total de itens encontrados
    prisma.funcionario.count({ where }),
  ]);

  return {
    funcionarios,
    qtdTotalDePaginas: contador > 0 ? Math.ceil(contador / itensPorPagina) : 1,
    paginaAtual: Number(pagina),
    total: contador,
  };
};

// "Deletar" conta do funcionario. Será solicitado o funcionário e senha do ADMIN
export const alterarStatusFuncionario = async (id, senhaAdmin) => {
  validarSenha(senhaAdmin);

  const admin = await prisma.admin.findFirst({ select: { senha: true } });
  if (!admin) {
    throw new AppError("Administrador não encontrado.", 404);
  }

  const senhaValida = await bcrypt.compare(senhaAdmin, admin.senha);
  if (!senhaValida) {
    throw new AppError("Senha do administrador incorreta.", 403);
  }

  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    select: { ativo: true },
  });

  if (!funcionario) {
    throw new AppError("Funcionário não encontrado.", 404);
  }

  const status = await prisma.funcionario.update({
    where: { id },
    data: { ativo: !funcionario.ativo }, // Inverte o status sempre
    select: {
      ativo: true,
    },
  });

  return { ativo: status.ativo };
};
