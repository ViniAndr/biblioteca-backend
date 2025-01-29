import AppError from "./AppError.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const verificarDuplicidade = async (campo, valor, entidade, msg) => {
  if (!campo || !valor || !entidade) {
    throw new AppError("Parâmetros para verificação de duplicidade estão faltando", 500);
  }

  const registroExiste = await prisma[entidade].findUnique({
    where: { [campo]: valor },
  });

  if (registroExiste && msg) {
    throw new AppError(msg, 409);
  } else {
    throw new AppError(`O ${campo} já está cadastrado para a entidade ${entidade}`, 409);
  }
};
