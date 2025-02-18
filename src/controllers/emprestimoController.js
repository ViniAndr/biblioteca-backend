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
  const clienteId = Number(req.usuarioId); // Obtém o ID do usuário autenticado
  const emprestimoId = Number(req.params.id); // Obtém o ID do empréstimo da URL

  try {
    await service.cancelarSolicitacao(clienteId, emprestimoId);
    return res.status(200).json({ mensagem: "Solicitação cancelada com sucesso" });
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

export const confirmarRetirada = async (req, res, next) => {
  const emprestimoId = Number(req.params.id);
  const funcionarioId = Number(req.usuarioId);

  try {
    const emprestimo = await service.confirmarRetirada(emprestimoId, funcionarioId);
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
