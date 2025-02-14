import * as service from "../services/emprestimoService.js";

// cliente solicita e precisa de aprovação
export const solicitar = async (req, res, next) => {
  const clienteId = Number(req.usuarioId);
  const livroId = Number(req.params.id);
  try {
    const solicitacao = await service.solicitarEmprestimo(clienteId, livroId);
    return res.status(200).json(solicitacao);
  } catch (error) {
    next(error);
  }
};

// funcionario deve fazer o emprestimo.
export const fazerEmprestimo = async (req, res, next) => {
  const funcionarioId = Number(req.usuarioId);
  try {
    const emprestimo = await service.fazerEmprestimo(funcionarioId, req.body);
    return res.status(200).json(emprestimo);
  } catch (error) {
    next(error);
  }
};

// aprovar, cancelar, atrasado, ...
export const atualizar = async (req, res) => {};

// retorno do livro
export const devolução = async (req, res) => {};
