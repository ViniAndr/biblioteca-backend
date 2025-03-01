import AppError from "./AppError.js";
import { format, parseISO } from "date-fns";

// Remove qualquer caractere que não seja numero
export const limparNumeros = (numero) => numero.replace(/\D/g, "").trim();

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

export const formatarData = (data) => {
  if (!data) return "Data inválida"; // Evita erro se `data` for undefined

  // Se `data` já for um objeto Date, não precisa chamar parseISO
  const dateObj = data instanceof Date ? data : parseISO(data);

  return format(dateObj, "dd/MM/yyyy");
};

// O status que é todo MAIÚSCULA retorna apens a primeira letra MAIÚSCULA
export const formatarStatus = (status) => {
  return `${status.charAt()}${status.slice(1).toLocaleLowerCase()}`;
};

export const formatarISBN = (isbn) => {
  // Aplica a formatação no padrão 978-XX-XXX-XXXX-X
  return `${isbn.slice(0, 3)}-${isbn.slice(3, 5)}-${isbn.slice(5, 8)}-${isbn.slice(8, 12)}-${isbn.slice(12)}`;
};
