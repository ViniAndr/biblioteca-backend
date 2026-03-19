import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import { EMPRESTIMO_STATUS } from "../utils/constants.js";

// A função dentro do schedule será chamada automaticamente na importação
// Rodar todo dia às 00:00 (meia-noite)
cron.schedule("0 0 * * *", async () => {
  console.log("Verificando solicitações vencidas...");

  // data e hora do momento para comparar com a dataVencimento
  const agora = new Date();

  try {
    // Atualiza todos os empréstimos vencidos que ainda estão "pendentes"
    const solicitacoesVencidas = await prisma.emprestimo.updateMany({
      where: {
        status: EMPRESTIMO_STATUS.SOLICITADO,
        // lt = menor que. Se prazoRetirada for menor que "agora", logo, venceu
        prazoRetirada: { lt: agora },
      },
      data: {
        status: EMPRESTIMO_STATUS.CANCELADO,
      },
    });

    console.log(`${solicitacoesVencidas.count} solicitações canceladas.`);
  } catch (error) {
    console.error("Erro ao cancelar solicitações:", error);
  }
});

// ## POSSO TER PROBLEMAS COM FUSO HORARIO, EU DO FUTURO RESOLVE.
