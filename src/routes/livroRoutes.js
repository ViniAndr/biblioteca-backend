import { Router } from "express";
const router = Router();

//Controller
import * as controller from "../controllers/livroController.js";

// Middlewares
import handleErrors from "../middlewares/handleErrors.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// Criar livro
router.post("/cadastro", authMiddleware, controller.cadastrado);

// editar livro
router.put("/atualizar/:id", authMiddleware, controller.atualizar);

// deletar
router.delete("/deletar/:id", authMiddleware, controller.deletar);

// listar todos livros
router.get("/listar", authMiddleware, controller.listarTodos);

// obter 1 livro
router.get("/:id", authMiddleware, controller.obterPorId);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
