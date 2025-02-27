import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// utils
import { EMPRESTIMO_STATUS } from "../utils/constants.js";

cron.schedule("0 0 * * *", async () => {
  const agora = new Date();

  try {
    const atrasados = await prisma.emprestimo.updateMany({
      where: {
        status: EMPRESTIMO_STATUS.EMPRESTADO,
        prazoDevolucao: { lt: agora },
      },
      data: {
        status: EMPRESTIMO_STATUS.ATRASADO,
      },
    });

    console.log(`${atrasados.count} emprestimos atrasados.`);
  } catch (error) {
    console.error("Erro na verificação de vencimento do prazo:", error);
  }
});
