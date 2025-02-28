import { Router } from "express";
const router = Router();

// controller
import * as emprestimo from "../controllers/emprestimoController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Apenas o cliete tem acesso a essa rota
router.post("/solicitar", authMiddleware, controleAcesso("cliente", true), emprestimo.solicitar);

// Cliente fazer empretimo diretamento com o funcionario
router.post("/criar", authMiddleware, controleAcesso("funcionario"), emprestimo.fazerEmprestimo);

// Apenas o cliete tem acesso a essa rota
router.put(
  "/cancelar-solicitacao/:id",
  authMiddleware,
  controleAcesso("cliente", true),
  validarId,
  emprestimo.cancelarSolicitacao
);

// Retirar o livro após solicitação pelo cliente
router.put(
  "/confirmar-retirada/:id",
  authMiddleware,
  controleAcesso("funcionario"),
  validarId,
  emprestimo.confirmarRetirada
);

// Devolução de um livro
router.put("/devolucao/:id", authMiddleware, controleAcesso("funcionario"), validarId, emprestimo.devolucao);

// renovar algum emprestimo, pode ser feito por qualquer pessoa logada
router.put("/renovar/:id", authMiddleware, validarId, emprestimo.renovarEmprestimo);

// lista todos os emprestimos e é acessado pelo funcionario, podendo usar filtros
router.get("/listar", authMiddleware, controleAcesso("funcionario"), emprestimo.listarTodos);

// cliente pode ver todo seu historico de emprestimos
router.get("/historico-cliente", authMiddleware, controleAcesso("cliente", true), emprestimo.HistoricoCliente);

// Listar os top X livros mais emprestados
router.get("/top-livros", emprestimo.topLivrosEmprestados);

// Listar os top X livros mais emprestados
router.get("/top-clientes", authMiddleware, controleAcesso("funcionario"), emprestimo.clientesMaisFrequentes);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
