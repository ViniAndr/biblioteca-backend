import * as clienteService from "../services/clienteService.js";

// metodo auxiliar para lidar com a resposta de erros
function lidarComErros(error, res) {
  // Resposta de erro personalizada
  if (error.statusCode != 500) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  // log do erro
  console.log(error);
  // Erro genérico
  return res.status(500).json({
    error: "Ocorreu um erro, tente novamente mais tarde",
  });
}

export const cadastroOnline = async (req, res) => {
  try {
    const novoCliente = await clienteService.cadastroCompleto(req.body);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso",
      cliente: novoCliente,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const cadastroPresencial = async (req, res) => {
  try {
    const novoCliente = await clienteService.cadastrorSimples(req.body);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso",
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
      mensagem: "Login feito com sucesso",
      token: loginCliente,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const verificaCadastroPresencial = async (req, res) => {
  try {
    const verificacao = await clienteService.cadastroPresencialParaOnline(req.body);

    return res.status(200).json({
      mensagem: "Sua conta presencial agora pode ser usada online",
      cliente: verificacao,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const perfilClienteLogado = async (req, res) => {
  const clienteId = req.usuarioId;

  if (!clienteId) {
    return res.status(401).json({ mensagem: "Usuário não autenticado." });
  }

  try {
    const dadosCliente = await clienteService.perfilDoCliente(clienteId);
    return res.status(200).json(dadosCliente);
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const consultarDadosDoClientePorId = async (req, res) => {
  const clienteId = Number(req.params.id);

  try {
    const dadosCliente = await clienteService.perfilDoCliente(clienteId);
    return res.status(200).json(dadosCliente);
  } catch (error) {
    lidarComErros(error, res);
  }
};
