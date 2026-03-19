import AppError from "./AppError.js";

// Valida o nome e sobrenome
export const validarNome = (nome) => {
  if (!nome || typeof nome !== "string") {
    throw new AppError("Nome inválido.", 400);
  }

  const nomeMinusculo = nome.toLowerCase().trim();
  const regexNome = /^[a-zà-ú.\s]{3,40}$/i; // para aceita nome composto
  if (!regexNome.test(nomeMinusculo)) {
    throw new AppError("O nome deve conter apenas letras e ter entre 3 e 40 caracteres", 400);
  }
};

// Validar o email
export const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new AppError("Email inválido.", 400);
  }
};

// Validar telefone
export const validarTelefone = (telefone) => {
  if (!telefone || typeof telefone !== "string") {
    throw new AppError("telefone inválido.", 400);
  }
  // só aceita 11 números e o terceiro é obrigatorio ser o 9
  const regexTelefone = /^[1-9]{2}9\d{8}$/;
  if (!telefone || !regexTelefone.test(telefone)) {
    throw new AppError("O telefone deve ter 11 digitos e o terceiro ser o 9.", 400);
  }
};

// Valida o formato da senha (mínimo de 6 caracteres e maximo 35 válidos)
export const validarSenha = (senha) => {
  if (!senha || typeof senha !== "string") {
    throw new AppError("Senha inválida.", 400);
  }
  if (senha.length < 6 || senha.length > 35) {
    throw new AppError("A senha deve ter entre 6 e 35 caracteres.", 400);
  }
};

// Validar CEP (brasileiro)
export const validarCEP = (cep) => {
  // só aceita numero e já no formato certo
  const regex = /^\d{5}-\d{3}$/;
  if (!regex.test(cep)) {
    throw new AppError("CEP inválido.", 400);
  }
};

// Validar no formato UF - front será um select que fornecerá os existentes
export const validarEstado = (estado) => {
  // apenas dois caracteres maiúsculos
  const estadoValido = /^[A-Z]{2}$/;
  if (!estadoValido.test(estado)) {
    throw new AppError("UF Invalido", 400);
  }
};

// Valida endereços (todos os campos obrigatórios)
export const validarEndereco = ({ logradouro, bairro, cidade, estado, cep }) => {
  if (!logradouro?.trim() || !bairro?.trim() || !cidade?.trim() || !estado?.trim() || !cep?.trim()) {
    throw new AppError("Todos os campos do endereço são obrigatórios.", 400);
  }

  validarCEP(cep);
  validarEstado(estado);
};

export const validarLivro = ({ titulo, isbn, qtdCopias, qtdDisponivel, edicao, autorId, editoraId, idioma }) => {
  if (!titulo || titulo.trim().length < 3) {
    throw new AppError("O título do livro é obrigatório e deve ter pelo menos 3 caracteres.", 400);
  }

  if (!isbn || !/^\d{13}$/.test(isbn)) {
    throw new AppError("O ISBN deve conter exatamente 13 dígitos numéricos.", 400);
  }

  if (!Number.isInteger(qtdCopias) || qtdCopias < 1) {
    throw new AppError("A quantidade de cópias deve ser um número inteiro maior que zero.", 400);
  }

  if (!Number.isInteger(qtdDisponivel) || qtdDisponivel < 0 || qtdDisponivel > qtdCopias) {
    throw new AppError(
      "A quantidade disponível deve ser um número inteiro entre 0 e a quantidade total de cópias.",
      400
    );
  }

  if (!Number.isInteger(edicao) || edicao < 1) {
    throw new AppError("A edição do livro é obrigatória.", 400);
  }

  if (!Number.isInteger(Number(autorId)) || Number(autorId) <= 0) {
    throw new AppError("O id do autor é invalido", 400);
  }
  if (!Number.isInteger(Number(editoraId)) || Number(editoraId) <= 0) {
    throw new AppError("O id da editora é invalido", 400);
  }

  if (!idioma || typeof idioma !== "string" || idioma.length > 5) {
    throw new AppError("Idioma invalido, use por exemplo: PT-BR, PT, EN", 400);
  }
};

export const validarId = (id) => {
  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new AppError("Id Invalido", 400);
  }
};
