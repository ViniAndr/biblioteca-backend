import AppError from "./AppError.js";

// Valida o ID (não vazio, numérico e válido)
export const valdiarId = (id) => {
  if (id || isNaN(Number(id)) || Number(id) < 1) {
    throw new AppError("Id inválido", 400);
  }
};

// Valida o nome e sobrenome
export const validarEFormatarNome = (nome) => {
  const nomeMinusculo = nome.toLowerCase();
  const regexNome = /^[a-zà-ú]{3,20}$/;
  if (!nomeMinusculo || nomeMinusculo.trim().length < 3 || regexNome.test(nomeMinusculo) || nomeMinusculo > 20) {
    // undefined, null, "  ", "an", "v1nic1us", "asdfghjklqwerrtyuioasc", ""
    throw new AppError("O nome deve ser válido", 400);
  }
};
