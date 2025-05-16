import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { validarLivro } from "../utils/validacao.js";
import AppError from "../utils/AppError.js";
import { limparNumeros, formatarISBN, formatarDataInput } from "../utils/formatador.js";
import { MENSAGENS_ERRO, EMPRESTIMO_STATUS } from "../utils/constants.js";
import { baixarImagemECriarVersoes } from "../utils/baixarImagemECriarVersoes.js";

// METODOS AUXILIAR
// Verifica se Autor ou Editara existe e caso não, ele cria e retorna o ID.
const obterAttSimplesOuCriar = async (nome, tabela) => {
  let atributo = await prisma[tabela].findUnique({ where: { nome } });
  if (!atributo) {
    atributo = await prisma[tabela].create({ data: { nome } });
  }
  return atributo;
};

export const cadastrado = async (dados, caminhoCapa, caminhoCapaPequena) => {
  const isbn = limparNumeros(dados.isbn);

  // Se o funcionário enviou uma capa, pega o caminho, se não, usa a padrão
  let capa = caminhoCapa || "";
  let capaPequena = caminhoCapaPequena || "";

  if (caminhoCapa?.startsWith("http")) {
    try {
      const resultado = await baixarImagemECriarVersoes(caminhoCapa);
      capa = resultado.capa;
      capaPequena = resultado.capaPequena;
    } catch (error) {
      console.error("Erro ao baixar e processar imagem:", error);
      throw new AppError("Não foi possível processar a imagem da capa", 500);
    }
  }

  const categoriasIds = dados.categoriaIds?.map((id) => Number(id)) || [];

  const dadosProntos = {
    titulo: dados.titulo,
    isbn,
    qtdCopias: Number(dados.qtdCopias),
    qtdDisponivel: Number(dados.qtdCopias),
    edicao: Number(dados.edicao),
    autorId: Number(dados.autorId),
    editoraId: Number(dados.editoraId),
    numeroPagina: dados.numeroPagina ? Number(dados.numeroPagina) : null,
    publicadoEm: dados.publicadoEm ? new Date(dados.publicadoEm) : null,
    idioma: typeof dados.idioma == "string" ? dados.idioma.trim() : null,
    capa,
    capaPequena,
    descricao: dados.descricao,
  };

  // validação
  validarLivro(dadosProntos);

  const livro = await prisma.livro.findUnique({ where: { isbn } });
  if (livro) throw new AppError("Esse livro já foi cadastrado", 400);

  const autor = await prisma.autor.findUnique({ where: { id: dadosProntos.autorId } });
  if (!autor) throw new AppError("Autor não econtrado", 404);

  const editora = await prisma.editora.findUnique({ where: { id: dadosProntos.editoraId } });
  if (!editora) throw new AppError("Editora não encontrada", 404);

  if (categoriasIds.length === 0) throw new AppError("Pelo menos uma categoria deve ser informada", 400);

  // Verifica se todas as categorias existem
  const categorias = await prisma.categoria.findMany({
    where: { id: { in: categoriasIds } },
  });

  if (categorias.length !== categoriasIds.length) {
    throw new AppError("Uma ou mais categorias não foram encontradas", 404);
  }

  await prisma.livro.create({
    data: {
      ...dadosProntos,
      categoria: {
        connect: categoriasIds.map((id) => ({ id })),
      },
    },
  });
};

// Atualizar cheio de validações
export const atualizar = async (id, dados) => {
  // O ID já vem validado pelo middleware

  // Busca o livro para garantir que ele existe e obter as categorias atuais
  const livro = await prisma.livro.findUnique({
    where: { id },
    include: { categoria: true }, // Inclui as categorias para comparar depois
  });

  if (!livro) {
    throw new AppError(MENSAGENS_ERRO.LIVRO_NAO_ENCONTRADO, 404);
  }

  // Mapeia os dados recebidos e prepara apenas os que devem ser atualizados
  const dadosNovos = {};

  for (const campo in dados) {
    const valorNovo = dados[campo]; // valor informado pelo funcionario
    const valorAtual = livro[campo]; // valor já salvo

    // Ignora campos que não foram enviados ou que já estão iguais
    if (valorNovo === undefined || valorNovo === valorAtual) {
      continue;
    }

    // Tratamento específico para cada campo
    switch (campo) {
      case "titulo":
        dadosNovos[campo] = valorNovo.trim();
        break;

      case "isbn":
        dadosNovos[campo] = limparNumeros(valorNovo.trim());
        break;

      case "categoriaIds":
        // Atualiza as categorias (precisa usar `set` para alterar corretamente no Prisma)
        dadosNovos.categoria = {
          set: valorNovo.map((id) => ({ id: Number(id) })),
        };
        break;
      // PROBLEMA - SE ALMENTAR O NUMERO DE CÓPIAS AUMENTA O DISPONIVEL?
      case "qtdCopias":
      case "qtdDisponivel":
      case "edicao":
      case "autorId":
      case "editoraId":
      case "numeroPagina": // Agora tratado corretamente
        dadosNovos[campo] = Number(valorNovo);
        break;

      case "publicadoEm":
      case "idioma":
      case "capa":
        // Esses campos devem ser mantidos como string
        dadosNovos[campo] = valorNovo;
        break;

      default:
        throw new AppError(`Campo inválido: ${campo}`, 400);
    }
  }

  // Se nenhum dado foi alterado, retorna erro
  if (Object.keys(dadosNovos).length === 0) {
    throw new AppError(MENSAGENS_ERRO.NENHUM_DADO_VALIDO, 400);
  }

  // Atualiza o livro no banco de dados
  await prisma.livro.update({
    where: { id },
    data: dadosNovos,
  });
};

export const deletar = async (id) => {
  // Id já vem validado pelo middleware
  const livro = await prisma.livro.findUnique({ where: { id } });
  if (!livro) throw new AppError("Livro não encontrado", 404);

  // verifico se tem algum emprestimo em andamento para esse livro
  const emprestimoAtivo = await prisma.emprestimo.findFirst({
    where: {
      livroId: id,
      status: { in: [EMPRESTIMO_STATUS.SOLICITADO, EMPRESTIMO_STATUS.EMPRESTADO, EMPRESTIMO_STATUS.ATRASADO] },
    },
  });

  // Se houver um empréstimo em andamento, impedir a exclusão
  if (emprestimoAtivo) {
    throw new AppError(
      "Não é possível excluir este livro, pois ele está emprestado ou possui uma solicitação pendente.",
      400
    );
  }

  await prisma.livro.update({
    where: { id },
    data: {
      disponivel: false,
      deletadoEm: new Date(),
    },
  });
};

export const verTodosLivros = async (titulo, autor, editora, categoria, pagina = 1, itensPorPagina) => {
  const where = { disponivel: true };

  // Filtro de busca por título
  if (titulo) {
    where.titulo = {
      contains: titulo, // Busca livros cujo nome contém o termo
      mode: "insensitive", // Ignora maiúsculas/minúsculas na busca
    };
  }
  if (autor) where.autorId = Number(autor);
  if (editora) where.editoraId = Number(editora);
  if (categoria)
    where.categoria = {
      some: {
        id: Number(categoria),
      },
    };

  const select = {
    id: true,
    titulo: true,
    isbn: true,
    qtdCopias: true,
    autor: true,
    editora: true,
    categoria: true,
    capaPequena: true,
  };

  const [livros, contador] = await prisma.$transaction([
    prisma.livro.findMany({
      where,
      select,
      take: Number(itensPorPagina),
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),

    prisma.livro.count({ where }),
  ]);

  const livrosFormatado = livros.map((l) => ({
    ...l,
    isbn: formatarISBN(l.isbn),
    edicao: `${l.edicao}°`,
  }));

  return {
    livros: livrosFormatado,
    qtdTotalDePaginas: contador > 0 ? Math.ceil(contador / itensPorPagina) : 1,
    paginaAtual: Number(pagina),
    total: contador,
  };
};

export const obterLivro = async (id) => {
  // Id já vem validado pelo middleware

  const select = {
    id: true,
    titulo: true,
    isbn: true,
    qtdCopias: true,
    qtdDisponivel: true,
    edicao: true,
    descricao: true,
    numeroPagina: true,
    publicadoEm: true,
    autor: true,
    editora: true,
    categoria: true,
    idioma: true,
    capa: true,
    capaPequena: true,
  };

  const livro = await prisma.livro.findUnique({
    where: { id },
    select,
  });
  if (!livro) throw new AppError("Livro não contrado", 404);

  livro.isbn = formatarISBN(livro.isbn);
  livro.edicao = `${livro.edicao}°`;

  return livro;
};

export const buscarLivroGoogle = async (isbn) => {
  const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
  // pegamos sempre o primeiro que aparecer
  const livro = response.data.items?.[0]?.volumeInfo;
  if (!livro) throw new AppError("Livro não encontrado na API do Google", 404);

  // Dados tratados
  const dadosLivro = {
    titulo: livro.title,
    autor: livro.authors ? livro.authors[0] : "Desconhecido",
    editora: livro.publisher || "Desconhecida",
    categorias: livro.categories || ["Literatura"],
    publicadoEm: livro.publishedDate ? formatarDataInput(new Date(livro.publishedDate)) : null,
    descricao: livro.description || "",
    numeroPagina: livro.pageCount || null,
    idioma: livro.language || "pt-BR",
    capa: livro.imageLinks?.thumbnail?.replace("&zoom=1", "") || "",
    capaPequena: livro.imageLinks?.thumbnail?.replace("&zoom=1", "&zoom=2") || "",
  };

  // buscar ou criar Autor
  dadosLivro.autor = await obterAttSimplesOuCriar(livro.authors[0], "autor");
  // buscar ou criar Autor
  dadosLivro.editora = await obterAttSimplesOuCriar(dadosLivro.editora, "editora");

  return dadosLivro;
};

// Lista os top 10 livros mais emprestados
export const listarLivrosMaisEmprestados = async () => {
  const STATUS_VALIDOS = [EMPRESTIMO_STATUS.EMPRESTADO, EMPRESTIMO_STATUS.DEVOLVIDO, EMPRESTIMO_STATUS.ATRASADO];

  const livrosMaisEmprestados = await prisma.emprestimo.groupBy({
    by: ["livroId"], // Agrupa pelo ID do livro
    where: {
      status: { in: STATUS_VALIDOS }, // apenas os que de fatos foram para a mão do cliente
    },
    _count: { livroId: true }, // Conta quantas vezes cada livroId aparece
    orderBy: { _count: { livroId: "desc" } }, // Ordena do maior para o menor
    take: 10, // Pega apenas os 10 primeiros resultados
  });

  // Agora buscamos os detalhes dos livros usando os IDs encontrados
  const livroIds = livrosMaisEmprestados.map((item) => item.livroId);

  const livrosDetalhados = await prisma.livro.findMany({
    // usado o in ao inves do Promisse.all porque aqui é apenas uma consulta, já no promisse são varias ao mesmo tempo
    where: { id: { in: livroIds } },
    select: {
      id: true,
      titulo: true,
      isbn: true,
      capaPequena: true,
      categoria: true,
      autor: true,
    },
  });

  // Juntar os dados dos livros com a contagem de empréstimos
  const resultadoFinal = livrosMaisEmprestados.map((emprestimo) => {
    // .find() é um método do Array - Ele percorre um array e retorna o primeiro elemento que satisfaz a condição passada.
    // verifico se o livro tem o id igual ao do emprestimo para juntar os dados úteis
    const livro = livrosDetalhados.find((l) => l.id === emprestimo.livroId);
    return {
      livroId: emprestimo.livroId,
      titulo: livro ? livro.titulo : "Desconhecido",
      isbn: formatarISBN(livro.isbn),
      totalEmprestimos: emprestimo._count.livroId,
      capa: livro.capaPequena,
      categoria: livro.categoria,
      autor: livro.autor,
    };
  });

  return resultadoFinal;
};
