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

export const formatarDataInput = (data) => {
  if (!data) return "Data inválida"; // Evita erro se `data` for undefined

  // Se `data` já for um objeto Date, não precisa chamar parseISO
  const dateObj = data instanceof Date ? data : parseISO(data);

  return format(dateObj, "yyyy-MM-dd");
};

// O status que é todo MAIÚSCULA retorna apens a primeira letra MAIÚSCULA
export const formatarStatus = (status) => {
  return `${status.charAt()}${status.slice(1).toLocaleLowerCase()}`;
};

export const formatarISBN = (isbn) => {
  if (!isbn) return "";

  // Limpa tudo que não for número ou a letra X (caso venha sujo do banco)
  const limpo = isbn.toString().replace(/[^0-9xX]/gi, "");

  // Se for o padrão antigo (10 caracteres) -> Ex: 85-359-0277-5
  if (limpo.length === 10) {
    return `${limpo.slice(0, 2)}-${limpo.slice(2, 5)}-${limpo.slice(5, 9)}-${limpo.slice(9)}`.toUpperCase();
  }
  // Se for o padrão novo (13 caracteres) -> Ex: 978-85-359-0277-8
  else if (limpo.length === 13) {
    return `${limpo.slice(0, 3)}-${limpo.slice(3, 5)}-${limpo.slice(5, 8)}-${limpo.slice(8, 12)}-${limpo.slice(12)}`;
  }

  // Se for algum tamanho bizarro, devolve sem formatar para não quebrar a tela
  return isbn.toUpperCase();
};

// Capitaliza a primeira letra de cada palavra, ignorando preposições no meio do texto
export const formatarNomeProprio = (texto) => {
  if (!texto) return "";

  const preposicoes = ["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o", "as", "os"];

  return texto
    .toLowerCase() // Transforma tudo em minúsculo primeiro
    .trim() // Remove espaços nas pontas
    .split(/\s+/) // Divide as palavras por espaço (lidando com múltiplos espaços sem querer)
    .map((palavra, index) => {
      // Se for uma preposição e não for a primeira palavra, deixa minúscula
      if (index !== 0 && preposicoes.includes(palavra)) {
        return palavra;
      }
      // Caso contrário, capitaliza a primeira letra da palavra
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(" "); // Junta tudo de volta com 1 espaço
};
