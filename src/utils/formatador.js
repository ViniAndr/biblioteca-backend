export const limparTelefone = (telefone) => {
  // Remove todos os caracteres que não sejam números
  const telefoneNumerico = telefone.replace(/\D/g, "");

  return telefoneNumerico.trim();
};

export const formatarTelefoneBR = (telefone) => {
  // Verifica se o número tem 10 ou 11 dígitos
  if (telefone.length === 10) {
    // Formato (XX) XXXX-XXXX
    return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1)$2-$3");
  } else if (telefone.length === 11) {
    // Formato (XX) 9XXXX-XXXX
    return telefone.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, "($1)$2$3-$4");
  } else {
    // Retorna o número original caso não tenha 10 ou 11 dígitos válidos
    return telefone;
  }
};

export const juntarNomes = (nome, sobrenome) => {
  const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
  const sobrenomeFormatado = sobrenome.charAt(0).toUpperCase() + sobrenome.slice(1).toLowerCase();

  return `${nomeFormatado} ${sobrenomeFormatado}`;
};
