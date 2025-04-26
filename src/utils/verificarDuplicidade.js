import AppError from "./AppError.js";

export default async (campo, valor, entidade, prisma) => {
  if (!campo || !valor || !entidade) {
    throw new AppError("Parâmetros para verificação de duplicidade estão faltando", 500);
  }

  const registroExiste = await prisma[entidade].findUnique({
    where: { [campo]: valor },
  });

  if (registroExiste) {
    throw new AppError(`Esse ${campo} já está em uso`, 409);
  }
};
