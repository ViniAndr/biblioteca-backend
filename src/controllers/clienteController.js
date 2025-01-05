import * as clienteService from "../services/clienteService.js";

// metodo auxiliar para lidar com a resposta de erros
function lidarComErros(error, res) {
  // Resposta de erro personalizada
  if (error.statusCode != 500) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  // log do erro
  console.log(error);
  // Erro genérico
  return res.status(500).json({
    error: "Ocorreu um erro, tente novamente mais tarde.",
  });
}

export const cadastroOnline = async (req, res) => {
  try {
    const novoCliente = await clienteService.cadastrarCliente(req.body, true);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      cliente: novoCliente,
    });
  } catch (error) {
    lidarComErros(error, res);
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
    lidarComErros(error, res);
  }
};

export const login = async (req, res) => {
  try {
    const loginCliente = await clienteService.login(req.body);

    return res.status(200).json({
      message: "Login feito com sucesso.",
      cliente: loginCliente,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const verificaCadastroPresencial = async (req, res) => {
  try {
    const verificacao = await clienteService.cadastroPresencialParaOnline(req.body);

    return res.status(200).json({
      message: "Sua conta presencial agora pode ser usada online.",
      cliente: verificacao,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};
