import { Router } from "express";
const router = Router();

//Controller
import * as controller from "../controllers/livroController.js";

// Middlewares
import handleErrors from "../middlewares/handleErrors.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Criar livro
router.post("/cadastro", authMiddleware, controleAcesso("funcionario"), controller.cadastrado);

// editar livro
router.put("/atualizar/:id", authMiddleware, controleAcesso("funcionario"), validarId, controller.atualizar);

// deletar
router.delete("/deletar/:id", authMiddleware, controleAcesso("funcionario"), validarId, controller.deletar);

// listar todos livros (Todos, até não logado)
router.get("/listar", authMiddleware, controller.listarTodos);

// obter 1 livro (Todos, até não logado)
router.get("/:id", authMiddleware, validarId, controller.obterPorId);

// Consulta API de livros do Google para obter metadados
router.get("/buscar-api/:isbn", authMiddleware, controleAcesso("funcionario"), controller.buscarLivroGoogle);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
