import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import AppError from "../utils/AppError.js";

// Funções auxiliares
// Validar o ID
function validarId(id, entidade) {
  if (!Number.isInteger(id) || id < 0) {
    throw new AppError(`ID do ${entidade} inválido.`, 400);
  }
}

// Calcula a data de volta do livro usando apenas dias uteis
function calcularDataDevolucao(diasUteis) {
  let data = new Date();
  let contador = 0;

  while (contador < diasUteis) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();

    if (diaSemana !== 0 && diaSemana !== 6) {
      contador++;
    }
  }

  return data;
}

// verifica se existe o livro a ser solicitado/emprestado e se tem cópia disponivel
async function livroExisteETemDisponivel(id) {
  const livro = await prisma.livro.findUnique({
    where: { id },
    select: { id, qtdDisponivel: true }, // Buscar só o necessário
  });

  // Verificações encima do livro
  if (!livro) throw new AppError("Livro não econtrado", 400);
  if (!livro.qtdDisponivel || livro.qtdDisponivel <= 0) {
    throw new AppError("No momento não temos nenhuma cópia disponível.", 400);
  }
}

// Verificar se o cliente existe
async function clienteExiste(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: { id: true }, // Apenas verificamos se existe
  });

  if (!cliente) throw new AppError("Cliente não encontrado.", 400);
}

// Checar se esse cliente já fez alguma solicitação anterior do mesmo livro e está em SOLICITADO ou EMPRESTADO
async function duplicidadeNoEmprestimo(cliente, livro) {
  const emprestimoExistente = await prisma.emprestimo.findFirst({
    where: {
      clienteId: cliente,
      livroId: livro,
      status: {
        in: ["SOLICITADO", "EMPRESTADO"],
      },
    },
  });
  if (emprestimoExistente) {
    throw new AppError("Você já tem um pedido em andamento para este livro.", 400);
  }
}

async function decrementarLivroDisponivel(livroId) {
  await prisma.livro.update({
    where: { id: livroId },
    data: { qtdDisponivel: { decrement: 1 } },
  });
}

async function incrementarLivroDisponivel(livroId) {
  await prisma.livro.update({
    where: { id: livroId },
    data: { qtdDisponivel: { increment: 1 } },
  });
}

// Cliente pode solicitar um emprestimo e terá um prazo para ir buscar o livro
export const solicitarEmprestimo = async (clienteId, livroId) => {
  validarId(clienteId, "cliente");
  validarId(livroId, "livro");

  // Verificações no banco
  await Promise.all([livroExisteETemDisponivel(livroId), duplicidadeNoEmprestimo(clienteId, livroId)]);

  // Transações do Prisma para garantir que ou ambas as operações são concluídas ou nenhuma delas é salva no banco
  return await prisma.$transaction(async (prisma) => {
    // Criar o empréstimo
    const novoEmprestimo = await prisma.emprestimo.create({
      // status e data da solicitação já estão com valores padrão
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
          select: {
            titulo: true,
          },
        },
      },
    });

    // Atualizar a quantidade de livros disponíveis
    await decrementarLivroDisponivel(livroId);

    return novoEmprestimo;
  });
};

// Criar um novo registro de emprestimo com o funcionario
export const fazerEmprestimo = async (funcionarioId, dados) => {
  const clienteId = Number(dados.clienteId);
  const livroId = Number(dados.livroId);

  validarId(clienteId, "cliente");
  validarId(livroId, "livro");

  // Verificações no banco
  await Promise.all([
    livroExisteETemDisponivel(livroId),
    clienteExiste(clienteId),
    duplicidadeNoEmprestimo(clienteId, livroId),
  ]);

  // Transações do Prisma para garantir que ou ambas as operações são concluídas ou nenhuma delas é salva no banco
  return await prisma.$transaction(async (prisma) => {
    // Criar o empréstimo
    const novoEmprestimo = await prisma.emprestimo.create({
      // status e data da solicitação já estão com valores padrão
      data: {
        status: "EMPRESTADO",
        dataSolicitacao: new Date(),
        dataEmprestimo: new Date(),
        dataDevolucao: calcularDataDevolucao(8),
        clienteId,
        funcionarioId,
        livroId,
      },
      select: {
        status: true,
        dataSolicitacao: true,
        dataDevolucao: true, // Correção aqui
        livro: {
          select: {
            titulo: true,
          },
        },
      },
    });

    // Atualizar a quantidade de livros disponíveis
    await decrementarLivroDisponivel(livroId);

    return novoEmprestimo;
  });
};

// Caso o cliente desista da solicitacao pode cancelar.
export const cancelarSolicitacao = async (clienteId, emprestimoId) => {
  // ID ja esta validado pelo middlware

  const emprestimo = await prisma.emprestimo.findUnique({
    where: {
      id: emprestimoId,
      clienteId: clienteId,
      status: "SOLICITADO",
    },
  });
  if (!emprestimo) throw new AppError("Solicitação não encontrada", 400);

  await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      status: "CANCELADO",
      dataCancelamento: new Date(),
    },
  });

  await incrementarLivroDisponivel(emprestimo.livroId);
};
