import { Router } from "express";
const router = Router();

//Controller
import * as controller from "../controllers/livroController.js";

// Middlewares
import handleErrors from "../middlewares/handleErrors.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validarId from "../middlewares/validarId.js";

// Criar livro
router.post("/cadastro", authMiddleware, controller.cadastrado);

// editar livro
router.put("/atualizar/:id", authMiddleware, validarId, controller.atualizar);

// deletar
router.delete("/deletar/:id", authMiddleware, validarId, controller.deletar);

// listar todos livros
router.get("/listar", authMiddleware, controller.listarTodos);

// obter 1 livro
router.get("/:id", authMiddleware, validarId, controller.obterPorId);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
