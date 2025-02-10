import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { validarLivro, validarId } from "../utils/validacao.js";
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
  validarId(id);
  const { titulo, isbn, qtdCopias, qtdDisponivel, edicao, autorId, editoraId, categoriaId } = dados;

  const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
  if (!livro) throw new AppError("Livro não contrado", 404);

  const dadosNovos = {};

  if (titulo && titulo.trim() && livro.titulo !== titulo) {
    dadosNovos.titulo = titulo.trim();
  }

  if (isbn && isbn.trim() && livro.isbn !== limparNumeros(isbn)) {
    dadosNovos.isbn = limparNumeros(isbn.trim());
  }

  if (Number.isInteger(qtdCopias) && qtdCopias > 0 && livro.qtdCopias !== qtdCopias) {
    dadosNovos.qtdCopias = qtdCopias;
  }

  if (Number.isInteger(qtdDisponivel) && qtdDisponivel >= 0 && livro.qtdDisponivel !== qtdDisponivel) {
    dadosNovos.qtdDisponivel = qtdDisponivel;
  }

  if (Number.isInteger(edicao) && edicao > 0 && livro.edicao !== edicao) {
    dadosNovos.edicao = edicao;
  }

  if (Number.isInteger(autorId) && autorId > 0 && livro.autorId !== autorId) {
    dadosNovos.autorId = autorId;
  }

  if (Number.isInteger(editoraId) && editoraId > 0 && livro.editoraId !== editoraId) {
    dadosNovos.editoraId = editoraId;
  }

  if (Number.isInteger(categoriaId) && categoriaId > 0 && livro.categoriaId !== categoriaId) {
    dadosNovos.categoriaId = categoriaId;
  }

  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError("Nenhum dado válido para atualizar.", 400);
  }

  await prisma.livro.update({
    where: { id: Number(id) },
    data: { ...dadosNovos },
  });
};

export const deletar = async (id) => {
  validarId(id);

  const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
  if (!livro) throw new AppError("Livro não contrado", 404);

  await prisma.livro.delete({ where: { id: Number(id) } });
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
  validarId(id);
  const livro = await prisma.livro.findUnique({
    where: { id: Number(id) },
    include: {
      autor: true,
      editora: true,
      categoria: true,
    },
  });
  if (!livro) throw new AppError("Livro não contrado", 404);

  return livro;
};
