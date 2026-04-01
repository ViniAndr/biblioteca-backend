import * as clienteService from "../services/clienteService.js";

export const criarContaOnline = async (req, res, next) => {
  try {
    const token = await clienteService.cadastroCompleto(req.body);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso",
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const criarContaPresencial = async (req, res, next) => {
  try {
    const novoCliente = await clienteService.cadastroSimples(req.body);

    // Retorna a resposta de sucesso
    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso",
      cliente: novoCliente,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const token = await clienteService.login(req.body);

    return res.status(200).json({
      mensagem: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const verificaCadastroPresencial = async (req, res, next) => {
  try {
    await clienteService.migrarContaPresencialParaOnline(req.body);

    return res.status(200).json({
      mensagem: "Migração realizada com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

export const verPerfil = async (req, res, next) => {
  const clienteId = Number(req.usuarioId);

  try {
    const dadosCliente = await clienteService.obterPerfil(clienteId);
    return res.status(200).json(dadosCliente);
  } catch (error) {
    next(error);
  }
};

export const obterPorId = async (req, res, next) => {
  const clienteId = Number(req.params.id);

  try {
    const dadosCliente = await clienteService.obterPerfil(clienteId);
    return res.status(200).json(dadosCliente);
  } catch (error) {
    next(error);
  }
};

export const atualizarPerfil = async (req, res, next) => {
  const clienteId = Number(req.usuarioId); // ID pego pelo Token (Segurança máxima)
  try {
    // Chama a nossa nova função unificada para o próprio cliente
    await clienteService.atualizarPerfilCliente(clienteId, req.body);
    return res.status(200).json({ mensagem: "Perfil atualizado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const atualizaPorId = async (req, res, next) => {
  const clienteId = Number(req.params.id); // ID pego pela URL
  try {
    // Chama a nova função unificada para o funcionário
    await clienteService.atualizarClientePeloFuncionario(clienteId, req.body);
    return res.status(200).json({ mensagem: "Dados do cliente atualizados com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const listarTodos = async (req, res, next) => {
  // Parametros opcionais para FILTROS
  const { pagina, nomeCliente, qtdItensPorPagina = 10 } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);
  try {
    const clientes = await clienteService.verTodosClientes(pagina, nomeCliente, itensPorPagina);
    return res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};
