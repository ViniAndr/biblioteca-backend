import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import { validarNome } from "../utils/validacao.js";
import AppError from "../utils/AppError.js";
import { MENSAGENS_ERRO } from "../utils/constants.js";

// Criar - autro, categoria ou editora
export const criar = async (entidade, dados) => {
  const { nome } = dados;
  validarNome(nome);

  const buscarPorNome = await prisma[entidade].findUnique({ where: { nome } });
  if (buscarPorNome)
    throw new AppError(
      `${entidade == "autor" ? "Esse" : "Essa"} ${entidade} já está ${
        entidade == "autor" ? "cadastrado" : "cadastrada"
      }`,
      400
    );

  await prisma[entidade].create({ data: dados });
};

// Porque não obter um? o front vai receber todos, logo pode pegar um sem solicitar ao back

export const obterTodos = async (entidade, nome, pagina = 1, itensPorPagina) => {
  const where = {};

  if (nome) {
    where.nome = {
      contains: nome, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }

  const [dados, contador] = await prisma.$transaction([
    prisma[entidade].findMany({
      where,
      select: {
        id: true,
        nome: true,
        _count: {
          select: { livros: true }, // Conta quantos livros cada atributo tem
        },
      },
      take: Number(itensPorPagina),
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),

    // Conta o total de autores para paginação
    prisma[entidade].count({ where }),
  ]);

  return {
    [entidade]: dados,
    qtdTotalDePaginas: Math.ceil(contador / itensPorPagina),
    paginaAtual: Number(pagina),
    total: contador,
  };
};

export const editar = async (entidade, id, dados) => {
  // Id já vem validado por middleware
  const buscar = await prisma[entidade].findUnique({ where: { id } });
  if (!buscar) throw new AppError(`${entidade} não existe`, 404);

  const dadosNovos = {};

  if (dados.nome.trim() && buscar.nome !== dados.nome) {
    dadosNovos.nome = dados.nome;
  }

  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  await prisma[entidade].update({
    where: { id },
    data: { ...dadosNovos },
  });
};

export const deletar = async (entidade, id) => {
  // Id já vem validado por middleware
  const buscar = await prisma[entidade].findUnique({ where: { id } });
  if (!buscar) throw new AppError(`${entidade} não existe`, 404);

  let count;

  if (entidade === "categoria") {
    count = await prisma.livro.count({
      where: { categoria: { some: { id } } },
    });
  } else {
    let campo = "";

    if (entidade === "autor") campo = "autorId";
    else if (entidade === "editora") campo = "editoraId";

    count = await prisma.livro.count({
      where: { [campo]: id },
    });
  }

  if (count > 0) {
    throw new AppError(`Não é possível excluir ${buscar.nome}, pois existem ${count} livro(s) associados.`, 400);
  }

  await prisma[entidade].delete({ where: { id } });
};
