import * as service from "../services/emprestimoService.js";

// cliente solicita e precisa de aprovação
export const solicitar = async (req, res, next) => {
  const clienteId = Number(req.usuarioId); // Obtém o ID do usuário autenticado
  const livroId = Number(req.body.livroId); // Obtém o ID do livro

  try {
    const solicitacao = await service.solicitarEmprestimo(clienteId, livroId);
    return res.status(200).json(solicitacao);
  } catch (error) {
    next(error);
  }
};

// funcionario deve fazer o emprestimo.
export const fazerEmprestimo = async (req, res, next) => {
  const funcionarioId = Number(req.usuarioId); // Obtém o ID do funcionário autenticado

  try {
    const emprestimo = await service.fazerEmprestimo(funcionarioId, req.body);
    return res.status(200).json(emprestimo);
  } catch (error) {
    next(error);
  }
};

// Cliente pode cancelar sua solicitação de empréstimo
export const cancelarSolicitacao = async (req, res, next) => {
  try {
    const { id } = req.params; // ID do empréstimo
    const usuarioId = req.usuarioId; // ID de quem está logado
    const papelUsuario = req.usuarioRole; // "cliente" ou "funcionario

    await service.cancelarSolicitacao(usuarioId, papelUsuario, Number(id));

    return res.status(200).json({ mensagem: "Solicitação cancelada com sucesso" });
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

export const confirmarRetirada = async (req, res, next) => {
  const funcionarioId = Number(req.usuarioId);
  const emprestimoId = Number(req.params.id);

  try {
    const emprestimo = await service.confirmarRetirada(funcionarioId, emprestimoId);
    return res.status(200).json({
      mensagem: "Retirada confirmada com sucesso",
      emprestimo,
    });
  } catch (error) {
    next(error);
  }
};

export const devolucao = async (req, res, next) => {
  const emprestimoId = Number(req.params.id);

  try {
    await service.devolucao(emprestimoId, req.body.estadoDevolucao);
    return res.status(200).json({ mensagem: "Devolução realizada com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const renovarEmprestimo = async (req, res, next) => {
  const emprestimoId = Number(req.params.id);

  try {
    const renovacao = await service.renovarEmprestimo(emprestimoId);
    return res.status(200).json(renovacao);
  } catch (error) {
    next(error);
  }
};

export const listarTodos = async (req, res, next) => {
  // Parametros opcionais para FILTROS
  const { pagina = 1, qtdItensPorPagina = 10, barraDeBusca, status, clienteId } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);

  try {
    const emprestimos = await service.listarEmprestimos(pagina, itensPorPagina, barraDeBusca, status, clienteId);
    return res.status(200).json(emprestimos);
  } catch (error) {
    next(error);
  }
};

export const obterEmprestimo = async (req, res, next) => {
  const emprestimoId = Number(req.params.id);
  const clienteId = req.usuarioRole === "cliente" ? req.usuarioId : null;
  try {
    const emprestimo = await service.obterEmprestimo(emprestimoId, clienteId);
    return res.status(200).json(emprestimo);
  } catch (error) {
    next(error);
  }
};

// Historico do cliente
export const HistoricoCliente = async (req, res, next) => {
  const clienteId = Number(req.usuarioId);
  // Parametros opcionais para FILTROS
  const { pagina = 1, qtdItensPorPagina = 20, status } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);

  try {
    const emprestimos = await service.listarEmprestimos(pagina, itensPorPagina, null, status, clienteId);
    return res.status(200).json(emprestimos);
  } catch (error) {
    next(error);
  }
};

export const clientesMaisFrequentes = async (req, res, next) => {
  try {
    const topClientes = await service.listarClientesMaisFrequentes();
    return res.status(200).json(topClientes);
  } catch (error) {
    next(error);
  }
};
