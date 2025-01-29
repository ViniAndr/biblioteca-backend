import AppError from "./AppError.js";

// Valida o ID (não vazio, numérico e válido)
export const valdiarId = (id) => {
  if (!id || isNaN(Number(id)) || Number(id) < 1) {
    throw new AppError("Id inválido", 400);
  }
};

// Valida o nome e sobrenome
export const validarNome = (nome) => {
  const nomeMinusculo = nome.toLowerCase().trim();
  const regexNome = /^[a-zà-ú]{3,20}$/;
  if (!nomeMinusculo || nomeMinusculo.length < 3 || !regexNome.test(nomeMinusculo) || nomeMinusculo.length > 20) {
    // undefined, null, "  ", "an", "v1nic1us", "asdfghjklqwerrtyuioasc", ""
    throw new AppError("O nome e sobrenome deve ser válidos", 400);
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
  // só aceita 11 números e o terceiro é obrigatorio ser o 9
  const regexTelefone = /^[1-9]{2}9\d{8}$/;
  if (!telefone || !regexTelefone.test(telefone)) {
    throw new AppError("telefone inválido.", 400);
  }
};

// Valida o formato da senha (mínimo de 6 caracteres e maximo 35 válidos)
export const validarSenha = (senha) => {
  if (!senha || senha.trim().length < 6 || senha.trim().length > 35) {
    throw new AppError("A senha deve ter entre 6 á 35 caracteres válidos.", 400);
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
  if (!logradouro || !bairro || !cidade || !estado || !cep) {
    throw new AppError("Todos os campos do endereço são obrigatórios.", 400);
  }

  validarCEP(cep);
  validarEstado(estado);
};
