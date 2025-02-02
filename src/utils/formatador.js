import AppError from "./AppError.js";

export const limparTelefone = (telefone) => telefone.replace(/\D/g, "").trim();

export const formatarTelefoneBR = (telefone) => {
  if (telefone.length !== 11) {
    return telefone;
  }
  return telefone.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1) $2$3-$4");
};

export const juntarNomes = (nome, sobrenome) => {
  if (!nome || !sobrenome) {
    throw new AppError("Nome e sobrenome são obrigatórios.", 400);
  }

  const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
  const sobrenomeFormatado = sobrenome.charAt(0).toUpperCase() + sobrenome.slice(1).toLowerCase();

  return `${nomeFormatado} ${sobrenomeFormatado}`;
};
