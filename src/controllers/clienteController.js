import * as clienteService from "../services/clienteService.js";

// metodo auxiliar para lidar com a resposta de erros
function lidarComErros(error, res) {
  // Resposta de erro personalizada
  if (error.statusCode && error.statusCode != 500) {
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
    const token = await clienteService.cadastroCompleto(req.body);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso",
      token,
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
    const token = await clienteService.login(req.body);

    return res.status(200).json({
      mensagem: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const verificaCadastroPresencial = async (req, res) => {
  try {
    await clienteService.cadastroPresencialParaOnline(req.body);

    return res.status(200).json({
      mensagem: "Sua conta presencial agora pode ser usada online",
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const perfilClienteLogado = async (req, res) => {
  const clienteId = req.usuarioId;

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

export const atualizarDados = async (req, res) => {
  const clienteId = req.usuarioId;
  try {
    await clienteService.atualizaDadosPessoais(clienteId, req.body);
    return res.status(200).json({ mensagem: "Dados atualizado com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const atualizarEnderecoDoCliente = async (req, res) => {
  const clienteId = req.usuarioId;
  try {
    await clienteService.atualizarEndereco(clienteId, req.body);
    return res.status(200).json({ mensagem: "Endereço atualizado com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const atualizarPeloFuncionario = async (req, res) => {
  const clienteId = Number(req.params.id);
  try {
    await clienteService.atualizaClienteComFuncionario(clienteId, req.body);
    return res.status(200).json({ mensagem: "Dados atualizado com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const listarClientes = async (req, res) => {
  // Parametros opcionais para FILTROS
  const { pagina, nomeCliente, qtdItensPorPagina } = req.query;
  const qtdItensPorPaginaAtual = qtdItensPorPagina ? Number(qtdItensPorPagina) : 10;
  try {
    const clientes = await clienteService.verTodosClientes(pagina, nomeCliente, qtdItensPorPaginaAtual);
    return res.status(200).json(clientes);
  } catch (error) {
    lidarComErros(error, res);
  }
};
