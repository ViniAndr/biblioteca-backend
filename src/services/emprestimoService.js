import { addDays, isBefore, isAfter } from "date-fns";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import AppError from "../utils/AppError.js";
import { validarId } from "../utils/validacao.js";
import calcularDataDevolucao from "../utils/calcularDataDevolucao.js";
import { MENSAGENS_ERRO, EMPRESTIMO_STATUS } from "../utils/constants.js";
import { formatarData, formatarTelefoneBR, formatarStatus, formatarISBN } from "../utils/formatador.js";

// Funções auxiliares
// verifica se existe o livro a ser solicitado/emprestado e se tem cópia disponivel
async function verificarLivroDisponivel(id) {
  const livro = await prisma.livro.findUnique({
    where: {
      id,
      disponivel: true,
    },
    select: { id, qtdDisponivel: true }, // Buscar só o necessário
  });

  // Verificações encima do livro
  if (!livro) throw new AppError(MENSAGENS_ERRO.LIVRO_NAO_ENCONTRADO, 400);
  if (!livro.qtdDisponivel || livro.qtdDisponivel <= 0) {
    throw new AppError(MENSAGENS_ERRO.LIVRO_NAO_DISPONIVEL, 400);
  }
}

// Verificar se o cliente existe
async function validarCliente(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: { id: true }, // Apenas verificamos se existe
  });

  if (!cliente) throw new AppError(MENSAGENS_ERRO.CLIENTE_NAO_ENCONTRADO, 400);
}

// Buscar empréstimo pelo status e validar
async function buscarEmprestimoPorStatus(id, statusPermitidos = []) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id },
    select: {
      status: true,
      clienteId: true,
      livroId: true,
      renovacoes: true,
      prazoDevolucao: true,
    },
  });

  if (!emprestimo) throw new AppError(MENSAGENS_ERRO.EMPRESTIMO_NAO_ENCONTRADO, 400);
  if (!statusPermitidos.includes(emprestimo.status)) {
    throw new AppError(MENSAGENS_ERRO.ACAO_INDISPONIVEL, 400);
  }

  return emprestimo;
}

async function Verificacoes(clienteId, livroId) {
  const [emprestimos] = await prisma.$queryRaw`
  SELECT 
    COUNT(CASE WHEN status = 'ATRASADO' THEN 1 END) AS temAtraso,
    COUNT(CASE WHEN "livroId" = ${livroId} AND status IN ('SOLICITADO', 'EMPRESTADO') THEN 1 END) AS duplicidade,
    COUNT(CASE WHEN status IN ('SOLICITADO', 'EMPRESTADO') THEN 1 END) AS totalEmprestimos
  FROM "Emprestimo" 
  WHERE "clienteId" = ${clienteId};
  `;

  // Verifica se esse cliente tem algum atraso
  if (emprestimos.temAtraso > 0) throw new AppError("Você possui empréstimos em atraso.", 400);
  // Checar se esse cliente já fez alguma solicitação anterior do mesmo livro e está em SOLICITADO ou EMPRESTADO
  if (emprestimos.duplicidade > 0) throw new AppError("Você já tem um empréstimo desse livro.", 400);
  // o Cliente só pode ter no maximo 3 emprestimo/solicitação em andamento
  if (emprestimos.totalEmprestimos >= 3)
    throw new AppError("Você já tem o máximo de empréstimos andamento permitidos.", 400);
}

// ########## FUNÇÕES DO EMPRESTIMO DE LIVRO ##########

// Cliente pode solicitar um emprestimo e terá um prazo para ir buscar o livro
export const solicitarEmprestimo = async (clienteId, livroId) => {
  // Id do cliente já é valdiado, mas o do livro não.
  validarId(livroId);

  // Verificações no banco - Garante a ordem e evita erro
  await verificarLivroDisponivel(livroId); // livro existe? tem disponivel?
  await Verificacoes(clienteId, livroId); // diversas validações

  // Transações do Prisma para garantir que ou ambas as operações são concluídas ou nenhuma delas é salva no banco
  const novoEmprestimo = await prisma.$transaction([
    prisma.emprestimo.create({
      data: {
        clienteId,
        livroId,
        prazoRetirada: calcularDataDevolucao(1),
      },
      select: {
        status: true,
        dataSolicitacao: true,
        prazoRetirada: true,
        livro: {
          select: { titulo: true },
        },
      },
    }),
    prisma.livro.update({
      where: { id: livroId },
      data: { qtdDisponivel: { decrement: 1 } },
    }),
  ]);

  // formtar datas
  novoEmprestimo[0].dataSolicitacao = formatarData(novoEmprestimo[0].dataSolicitacao);
  novoEmprestimo[0].prazoRetirada = formatarData(novoEmprestimo[0].prazoRetirada);

  return novoEmprestimo[0];
};

// Criar um novo registro de emprestimo com o funcionario
export const fazerEmprestimo = async (funcionarioId, dados) => {
  // Id do funcionario já vem validado
  const clienteId = Number(dados.clienteId);
  const livroId = Number(dados.livroId);

  validarId(clienteId);
  validarId(livroId);

  // Verificações no banco - garante a ordem e impede erro, contra é o tempo a mais para cada consulta
  await verificarLivroDisponivel(livroId); // se o livro existe e se tem copia disponivel
  await validarCliente(clienteId); // se o cliente existe
  await Verificacoes(clienteId, livroId);

  // Transações do Prisma para garantir que ambas as operações são concluídas ou nenhuma delas é salva no banco
  const emprestimo = await prisma.$transaction([
    // Criar o empréstimo
    prisma.emprestimo.create({
      // status e data da solicitação já estão com valores padrão
      data: {
        status: EMPRESTIMO_STATUS.EMPRESTADO,
        dataSolicitacao: new Date(),
        dataEmprestimo: new Date(),
        prazoDevolucao: calcularDataDevolucao(8),
        clienteId,
        funcionarioId,
        livroId,
      },
      select: {
        status: true,
        dataSolicitacao: true,
        prazoDevolucao: true,
        livro: {
          select: {
            titulo: true,
          },
        },
      },
    }),

    // Atualizar a quantidade de livros disponíveis
    prisma.livro.update({
      where: { id: livroId },
      data: { qtdDisponivel: { decrement: 1 } },
    }),
  ]);

  emprestimo[0].dataSolicitacao = formatarData(emprestimo[0].dataSolicitacao);
  emprestimo[0].prazoDevolucao = formatarData(emprestimo[0].prazoDevolucao);

  return emprestimo;
};

// Caso o cliente desista da solicitacao pode cancelar.
export const cancelarSolicitacao = async (clienteId, emprestimoId) => {
  // Id do cliente já é validado(Req) e do emprestimo também pelo middlware
  const emprestimo = await buscarEmprestimoPorStatus(emprestimoId, [EMPRESTIMO_STATUS.SOLICITADO]);
  if (emprestimo.clienteId !== clienteId) throw new AppError("Essa solicitação não pertence a esse cliente", 400);

  await prisma.$transaction([
    prisma.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: EMPRESTIMO_STATUS.CANCELADO,
        dataCancelamento: new Date(),
      },
    }),

    prisma.livro.update({
      where: { id: emprestimo.livroId },
      data: { qtdDisponivel: { increment: 1 } },
    }),
  ]);
};

// O cliente ir buscar o livro após solicitar o emprestimo
export const confirmarRetirada = async (funcionarioId, emprestimoId) => {
  // Id do funcionario já é validado(Req) e do emprestimo também pelo middlware
  await buscarEmprestimoPorStatus(emprestimoId, [EMPRESTIMO_STATUS.SOLICITADO]);

  const emprestimo = await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      status: EMPRESTIMO_STATUS.EMPRESTADO,
      dataEmprestimo: new Date(),
      prazoDevolucao: calcularDataDevolucao(8),
      funcionarioId,
    },
    select: {
      prazoDevolucao: true,
    },
  });

  emprestimo.prazoDevolucao = formatarData(emprestimo.prazoDevolucao);

  return emprestimo;
};

export const devolucao = async (emprestimoId, estadoDevolucao) => {
  // Id do emprestimo já vem valdiado pelo middleware
  const emprestimo = await buscarEmprestimoPorStatus(emprestimoId, [
    EMPRESTIMO_STATUS.EMPRESTADO,
    EMPRESTIMO_STATUS.ATRASADO,
  ]);

  if (!estadoDevolucao || typeof estadoDevolucao !== "string") {
    throw new AppError("Informe um estado para o livro", 400);
  }

  await prisma.$transaction([
    // Realizar devolução
    prisma.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: EMPRESTIMO_STATUS.DEVOLVIDO,
        dataDevolucao: new Date(),
        estadoDevolucao,
      },
    }),

    // aumenta a quantidade de livro disponivel
    prisma.livro.update({
      where: { id: emprestimo.livroId },
      data: { qtdDisponivel: { increment: 1 } },
    }),
  ]);
};

export const renovarEmprestimo = async (emprestimoId) => {
  // Id do emprestimo já vem valdiado pelo middleware
  const emprestimo = await buscarEmprestimoPorStatus(emprestimoId, [
    EMPRESTIMO_STATUS.EMPRESTADO,
    EMPRESTIMO_STATUS.ATRASADO,
  ]);

  // controle sobre quantas renovações poderá ser feitas.
  const maxRenovacoes = 2;
  if (emprestimo.renovacoes >= maxRenovacoes) {
    throw new AppError("Limite de renovações atingido.", 400);
  }

  // Datas de renovação
  const hoje = new Date();
  const prazoDevolucao = emprestimo.prazoDevolucao;
  const aberturaRenovacao = addDays(prazoDevolucao, -2);

  if (isBefore(hoje, aberturaRenovacao) || isAfter(hoje, prazoDevolucao)) {
    throw new AppError(
      `Renovação só permitida entre ${formatarData(aberturaRenovacao)} e ${formatarData(prazoDevolucao)}`,
      400
    );
  }

  const renovacao = await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      prazoDevolucao: calcularDataDevolucao(3, emprestimo.prazoDevolucao),
      renovacoes: { increment: 1 },
    },
    select: {
      prazoDevolucao: true,
      renovacoes: true,
    },
  });

  renovacao.prazoDevolucao = formatarData(renovacao.prazoDevolucao);

  return renovacao;
};

// Listar emprestimo agora está modular para mostrar todos e para mostrar apenas o de um unico cliente
export const listarEmprestimos = async (pagina, itensPorPagina, livro, status, clienteId) => {
  const where = {};

  // Buscar pelo titulo do livro
  if (livro) {
    where.livro = {
      some: {
        titulo: {
          contains: livro,
          mode: "insensitive",
        },
      },
    };
  }

  if (status) where.status = status;
  if (clienteId) where.clienteId = clienteId;

  // Configuração do `select`, removendo `cliente` se `clienteId` for `false`
  const select = {
    id: true,
    status: true,
    dataSolicitacao: true,
    livro: {
      select: {
        titulo: true,
        isbn: true,
      },
    },
  };

  if (!clienteId) {
    select.cliente = {
      select: {
        nome: true,
      },
    };
  }

  const [emprestimos, contador] = await prisma.$transaction([
    // ainda não pensei no que mostrar no front
    prisma.emprestimo.findMany({
      where,
      select,
      orderBy: { dataSolicitacao: "desc" },
      take: Number(itensPorPagina),
      skip: (Number(pagina) - 1) * Number(itensPorPagina),
    }),

    // Diz o total de itens encontrados
    prisma.emprestimo.count({ where }),
  ]);

  // Formatar as datas
  const emprestimosFormatados = emprestimos.map((emprestimo) => {
    emprestimo.livro.isbn = formatarISBN(emprestimo.livro.isbn);
    return {
      ...emprestimo,
      dataSolicitacao: formatarData(emprestimo.dataSolicitacao),
    };
  });

  return {
    emprestimos: emprestimosFormatados,
    qtdTotalDePaginas: Math.ceil(contador / itensPorPagina),
    paginaAtual: Number(pagina),
    total: contador,
  };
};

// ver detalhadamente o emprestimo
export const obterEmprestimo = async (id, clienteId) => {
  // id já vem validado pelo midlleware e clienteId pelo req

  const where = { id };

  if (clienteId) where.clienteId = clienteId;

  const select = {
    id: true,
    status: true,
    dataSolicitacao: true,
    prazoRetirada: true,
    dataEmprestimo: true,
    prazoDevolucao: true,
    dataDevolucao: true,
    estadoDevolucao: true,
    dataCancelamento: true,
    renovacoes: true,
    funcionario: {
      select: {
        id: true,
        nome: true,
      },
    },
    livro: {
      select: {
        id: true,
        titulo: true,
        isbn: true,
        qtdCopias: true,
        qtdDisponivel: true,
        edicao: true,
        autor: true,
        editora: true,
        categoria: true,
      },
    },
  };

  // Se for o funcionario que esteja acessando ele ver os dados do cliente
  if (!clienteId) {
    select.cliente = {
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        logradouro: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        cep: true,
      },
    };
  }

  const emprestimo = await prisma.emprestimo.findUnique({
    where,
    select,
  });
  if (!emprestimo) throw new AppError(MENSAGENS_ERRO.EMPRESTIMO_NAO_ENCONTRADO, 404);

  // Formatações
  emprestimo.status = formatarStatus(emprestimo.status);
  emprestimo.livro.edicao = `${emprestimo.livro.edicao}°`;
  emprestimo.livro.isbn = formatarISBN(emprestimo.livro.isbn);
  emprestimo.dataSolicitacao = formatarData(emprestimo.dataSolicitacao);
  emprestimo.prazoRetirada = formatarData(emprestimo.prazoRetirada);
  emprestimo.dataEmprestimo = emprestimo.dataEmprestimo ? formatarData(emprestimo.dataEmprestimo) : "Aguardando";
  emprestimo.prazoDevolucao = emprestimo.prazoDevolucao ? formatarData(emprestimo.prazoDevolucao) : "Aguardando";
  emprestimo.dataDevolucao = emprestimo.dataDevolucao ? formatarData(emprestimo.dataDevolucao) : "Aguardando";
  emprestimo.estadoDevolucao = emprestimo.estadoDevolucao || "Aguardando";
  emprestimo.dataCancelamento = emprestimo.dataCancelamento ? formatarData(emprestimo.dataCancelamento) : "Aguardando";
  if (emprestimo.cliente) {
    emprestimo.cliente.telefone = formatarTelefoneBR(emprestimo.cliente.telefone);
  }

  return emprestimo;
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
    };
  });

  return resultadoFinal;
};

export const listarClientesMaisFrequentes = async () => {
  const STATUS_VALIDOS = [EMPRESTIMO_STATUS.EMPRESTADO, EMPRESTIMO_STATUS.DEVOLVIDO, EMPRESTIMO_STATUS.ATRASADO];

  const clientesMaisFrequentes = await prisma.emprestimo.groupBy({
    by: ["clienteId"],
    where: {
      status: { in: STATUS_VALIDOS },
    },
    _count: { clienteId: true },
    orderBy: { _count: { clienteId: "desc" } },
    take: 10,
  });

  // Pegando apenas os IDs dos clientes
  const clienteIds = clientesMaisFrequentes.map((cliente) => cliente.clienteId);

  // Buscando os detalhes dos clientes usando `prisma.cliente.findMany()`
  const clientesDetalhados = await prisma.cliente.findMany({
    where: { id: { in: clienteIds } },
    select: {
      id: true,
      nome: true,
    },
  });

  // Juntando os dados
  const resultadoFinal = clientesMaisFrequentes.map((emprestimo) => {
    const cliente = clientesDetalhados.find((c) => c.id === emprestimo.clienteId);
    return {
      clienteId: emprestimo.clienteId,
      nome: cliente.nome,
      totalEmprestimos: emprestimo._count.clienteId,
    };
  });

  return resultadoFinal;
};

// ##### AÇÕES AUTOMATICOS são FEITAS PELO CRON JOB #####
