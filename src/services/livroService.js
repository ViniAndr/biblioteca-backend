import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { validarLivro } from "../utils/validacao.js";
import AppError from "../utils/AppError.js";
import { limparNumeros } from "../utils/formatador.js";

export const cadastrado = async (dados) => {
  const isbn = limparNumeros(dados.isbn);
  const dadosProntos = {
    titulo: dados.titulo,
    isbn,
    qtdCopias: Number(dados.qtdCopias),
    qtdDisponivel: Number(dados.qtdDisponivel),
    edicao: Number(dados.edicao),
    autorId: Number(dados.autorId),
    editoraId: Number(dados.editoraId),
    categoriaId: Number(dados.categoriaId),
  };

  // validação
  validarLivro(dadosProntos);

  const livro = await prisma.livro.findUnique({ where: { isbn } });
  if (livro) throw new AppError("Esse livro já foi cadastrado", 400);

  await prisma.livro.create({ data: { ...dadosProntos } });
};

export const atualizar = async (id, dados) => {
  const campos = Object.keys(dados);

  const livro = await prisma.livro.findUnique({ where: { id } });
  if (!livro) throw new AppError("Livro não encontrado", 404);

  const dadosNovos = campos.reduce((obj, campo) => {
    if (dados[campo] === undefined || dados[campo] === livro[campo]) {
      return obj; // Ignora valores iguais ou não definidos
    }

    if (campo === "titulo") {
      obj[campo] = dados[campo].trim();
    } else if (campo === "isbn") {
      obj[campo] = limparNumeros(dados[campo].trim());
    } else {
      obj[campo] = Number(dados[campo]); // Se não for título nem ISBN, é número
    }

    return obj;
  }, {});

  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  await prisma.livro.update({
    where: { id },
    data: dadosNovos,
  });
};

export const deletar = async (id) => {
  const livro = await prisma.livro.findUnique({ where: { id } });
  if (!livro) throw new AppError("Livro não encontrado", 404);

  await prisma.livro.delete({ where: { id } });
};

export const verTodosLivvros = async (titulo, autor, editora, categoria, pagina = 1, itensPorPagina) => {
  const where = {};

  // Filtro de busca por título
  if (titulo) {
    where.titulo = {
      contains: titulo, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }
  if (autor) where.autorId = Number(autor);
  if (categoria) where.categoriaId = Number(categoria);
  if (editora) where.editoraId = Number(editora);

  const livros = await prisma.livro.findMany({
    where,
    include: {
      autor: true,
      editora: true,
      categoria: true,
    },
    take: Number(itensPorPagina),
    skip: (Number(pagina) - 1) * Number(itensPorPagina),
  });

  const contador = await prisma.livro.count({ where });

  return {
    livros,
    qtdTotalDePaginas: Math.ceil(contador / itensPorPagina),
    paginaAtual: Number(pagina),
  };
};

export const obterLivro = async (id) => {
  const livro = await prisma.livro.findUnique({
    where: { id },
    include: {
      autor: true,
      editora: true,
      categoria: true,
    },
  });
  if (!livro) throw new AppError("Livro não contrado", 404);

  return livro;
};
