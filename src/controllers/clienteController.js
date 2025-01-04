import * as clienteService from "../services/clienteService.js";

export const cadastroOnline = async (req, res) => {
  try {
    const novoCliente = await clienteService.cadastrarCliente(req.body, true);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      cliente: novoCliente,
    });
  } catch (error) {
    // Resposta de erro personalizada
    if (
      error.message === "Já existe um usuário com esse email." ||
      error.message === "Já existe um usuário com esse telefone."
    ) {
      return res.status(400).json({ error: error.message });
    } else {
      console.error(error);
    }

    // Erro genérico
    return res.status(500).json({
      error: "Ocorreu um erro, tente novamente mais tarde.",
    });
  }
};

export const cadastroPresencial = async (req, res) => {
  try {
    const novoCliente = await clienteService.cadastrarCliente(req.body, false);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      cliente: novoCliente,
    });
  } catch (error) {
    // Resposta de erro personalizada
    if (error.message === "Já existe um usuário com esse telefone.") {
      return res.status(400).json({ error: error.message });
    } else {
      console.error(error); // Log para debug
    }

    // Erro genérico
    return res.status(500).json({
      error: "Ocorreu um erro, tente novamente mais tarde.",
    });
  }
};
