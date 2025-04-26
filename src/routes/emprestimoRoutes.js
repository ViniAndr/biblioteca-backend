import { Router } from "express";
const router = Router();

// Controller
import * as emprestimo from "../controllers/emprestimoController.js";

// Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Solicitar um empréstimo
router.post("/", authMiddleware, controleAcesso("cliente", true), emprestimo.solicitar);

// Criar um empréstimo (feito por funcionário)
router.post("/funcionario", authMiddleware, controleAcesso("funcionario"), emprestimo.fazerEmprestimo);

// Cancelar uma solicitação de empréstimo
router.patch("/:id/cancelar", authMiddleware, controleAcesso("cliente", true), validarId, emprestimo.cancelarSolicitacao);

// Confirmar retirada de um livro após solicitação do cliente
router.patch("/:id/retirada", authMiddleware, controleAcesso("funcionario"), validarId, emprestimo.confirmarRetirada);

// Devolver um livro
router.patch("/:id/devolucao", authMiddleware, controleAcesso("funcionario"), validarId, emprestimo.devolucao);

// Renovar um empréstimo
router.patch("/:id/renovacao", authMiddleware, validarId, emprestimo.renovarEmprestimo);

// Listar todos os empréstimos (acessado por funcionários)
router.get("/", authMiddleware, controleAcesso("funcionario"), emprestimo.listarTodos);

// Obter detalhes de um empréstimo específico
router.get("/:id", authMiddleware, emprestimo.obterEmprestimo);

// Ver histórico de empréstimos de um cliente específico
router.get("/clientes/:id/historico", authMiddleware, controleAcesso("cliente", true), emprestimo.HistoricoCliente);

// Listar os top X clientes mais frequentes
router.get("/top-clientes", authMiddleware, controleAcesso("funcionario"), emprestimo.clientesMaisFrequentes);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
