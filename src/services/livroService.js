import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { validarLivro } from "../utils/validacao.js";
import AppError from "../utils/AppError.js";
import { limparNumeros, formatarISBN, formatarDataInput } from "../utils/formatador.js";
import { MENSAGENS_ERRO, EMPRESTIMO_STATUS } from "../utils/constants.js";
import { baixarImagemECriarVersoes } from "../utils/baixarImagemECriarVersoes.js";
import { apagarImagensAntigas } from "../utils/gerenciadorArquivos.js";

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
    estante: dados.estante ? String(dados.estante).trim() : null,
    prateleira: dados.prateleira ? String(dados.prateleira).trim() : null,
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

  if (dados.capa && dados.capa.startsWith("http")) {
    try {
      const resultado = await baixarImagemECriarVersoes(dados.capa);
      // Substitui o link da internet pelos caminhos locais recém-baixados
      dados.capa = resultado.capa;
      dados.capaPequena = resultado.capaPequena;
    } catch (error) {
      console.error("Erro ao baixar e processar imagem na edição:", error);
      throw new AppError("Não foi possível processar a nova imagem da capa", 500);
    }
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
      // PROBLEMA - SE AUMENTAR O NUMERO DE CÓPIAS AUMENTA O DISPONIVEL?
      case "qtdCopias":
        const novasCopias = Number(valorNovo);
        const diferencaCopias = novasCopias - livro.qtdCopias; // Quantos livros a mais (ou a menos)

        dadosNovos.qtdCopias = novasCopias;
        // Atualiza a quantidade disponível somando a diferença (garantindo que nunca fique menor que 0)
        dadosNovos.qtdDisponivel = Math.max(0, livro.qtdDisponivel + diferencaCopias);
        break;
      case "qtdDisponivel":
        // Como já calculamos acima, o frontend nem precisaria mandar isso na edição.
        // Mas se mandar, a gente só atualiza se for um valor válido.
        dadosNovos[campo] = Number(valorNovo);
        break;
      case "edicao":
      case "autorId":
      case "editoraId":
      case "numeroPagina": // Agora tratado corretamente
        dadosNovos[campo] = Number(valorNovo);
        break;

      case "publicadoEm":
        dadosNovos[campo] = new Date(`${valorNovo}T00:00:00.000Z`);
        break;
      case "idioma":
      case "capa":
      case "capaPequena":
      case "descricao":
      case "estante":
      case "prateleira":
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

  if (dadosNovos.capa && dadosNovos.capa !== livro.capa) {
    // rodar em "background" (sem o await) para não travar a resposta do usuário
    apagarImagensAntigas(livro.capa, livro.capaPequena);
  }
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
      400,
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

export const reativar = async (id) => {
  // O id já vem validado pelo middleware
  const livro = await prisma.livro.findUnique({ where: { id } });

  if (!livro) {
    throw new AppError("Livro não encontrado", 404);
  }

  // Se o livro já estiver ativo, não faz sentido reativar
  if (livro.disponivel) {
    throw new AppError("Este livro já se encontra ativo no sistema.", 400);
  }

  // Reverte a exclusão lógica
  await prisma.livro.update({
    where: { id },
    data: {
      disponivel: true,
      deletadoEm: null, // Limpa o registo de que foi apagado
    },
  });
};

export const verTodosLivros = async (titulo, autor, editora, categoria, pagina = 1, itensPorPagina, status) => {
  const where = {}; // Começa vazio

  // Se o front pedir inativos, busca false. Se não pedir nada (ou pedir ativos), busca true.
  if (status === "inativo") {
    where.disponivel = false;
  } else {
    where.disponivel = true; // Padrão
  }

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
    qtdDisponivel: true,
    autor: true,
    editora: true,
    categoria: true,
    capaPequena: true,
    estante: true,
    prateleira: true,
  };

  const [livros, contador, agregacao] = await prisma.$transaction([
    prisma.livro.findMany({
      where,
      select,
      take: Number(itensPorPagina),
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),

    // Conta quantos Títulos únicos existem (quantas linhas)
    prisma.livro.count({ where }),

    // Soma a coluna de quantidade de todos os livros filtrados!
    prisma.livro.aggregate({
      where,
      _sum: {
        qtdCopias: true,
      },
    }),
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
    totalTitulos: contador,
    totalExemplares: agregacao._sum.qtdCopias || 0,
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
    estante: true,
    prateleira: true,
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
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`,
    );

    const livroInfo = response.data.items?.[0]?.volumeInfo;
    if (!livroInfo) throw new AppError("Livro não encontrado na API do Google", 404);

    // Extrair os nomes de forma segura antes de usá-los
    const nomeAutor = livroInfo.authors ? livroInfo.authors[0] : "Desconhecido";
    const nomeEditora = livroInfo.publisher || "Desconhecida";

    // Montar o objeto tratado
    const dadosLivro = {
      titulo: livroInfo.title,
      autor: nomeAutor, // <-- Usamos a variável segura
      editora: nomeEditora, // <-- Usamos a variável segura
      categorias: livroInfo.categories || ["Literatura"],
      publicadoEm: livroInfo.publishedDate ? formatarDataInput(new Date(livroInfo.publishedDate)) : null,
      descricao: livroInfo.description || "",
      numeroPagina: livroInfo.pageCount || null,
      idioma: livroInfo.language || "pt-BR",
      capa: livroInfo.imageLinks?.thumbnail?.replace("&zoom=1", "") || "",
      capaPequena: livroInfo.imageLinks?.thumbnail?.replace("&zoom=1", "&zoom=2") || "",
    };

    // Buscar ou criar no banco usando as variáveis seguras!
    dadosLivro.autor = await obterAttSimplesOuCriar(nomeAutor, "autor");
    dadosLivro.editora = await obterAttSimplesOuCriar(nomeEditora, "editora");

    return dadosLivro;
  } catch (error) {
    // Se o erro for o bloqueio do Google (429), mandamos uma mensagem amigável para o usuário
    if (error.response?.status === 429) {
      throw new AppError("Limite de buscas excedido. Aguarde alguns minutos e tente novamente.", 429);
    }

    // Se for o nosso erro de "Não encontrado", repassamos ele
    if (error instanceof AppError) {
      throw error;
    }

    // Se for qualquer outra coisa (API fora do ar, erro de rede), evitamos o erro 500 genérico
    throw new AppError("Erro inesperado ao buscar dados no Google Books.", 500);
  }
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
