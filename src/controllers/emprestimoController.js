import * as service from "../services/emprestimoService.js";

// cliente solicita e precisa de aprovação
export const solicitar = async (req, res, next) => {
  const clienteId = Number(req.usuarioId);
  const livroId = Number(req.body.livroId);
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

// Cliente pode cancelar sua solicitação de empréstimo
export const cancelarSolicitacao = async (req, res, next) => {
  const clienteId = Number(req.usuarioId); // Obtém o ID do usuário autenticado
  const emprestimoId = Number(req.params.id); // Obtém o ID do empréstimo da URL

  try {
    await service.cancelarSolicitacao(clienteId, emprestimoId);
    return res.status(200).json({ mensagem: "Solicitação cancelada com sucesso" });
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

// aprovar, cancelar, atrasado, ...
export const atualizar = async (req, res) => {};

// retorno do livro
export const devolução = async (req, res) => {};
