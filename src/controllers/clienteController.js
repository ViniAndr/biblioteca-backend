import * as clienteService from "../services/clienteService.js";

export const cadastroOnline = async (req, res) => {
  const dadosCliente = req.body;

  try {
    // Chama o service para criar o cliente
    const novoCliente = await clienteService.cadastroCompleto(dadosCliente);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      cliente: novoCliente,
    });
  } catch (error) {
    console.error(error); // Log para debug

    // Resposta de erro personalizada
    if (
      error.message === "Já existe um usuário com esse email." ||
      error.message === "Já existe um usuário com esse telefone."
    ) {
      return res.status(400).json({ error: error.message });
    }

    // Erro genérico
    return res.status(500).json({
      error: "Ocorreu um erro, tente novamente mais tarde.",
    });
  }
};
