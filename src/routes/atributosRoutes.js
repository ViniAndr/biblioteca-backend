import { Router } from "express";
const router = Router();

// controller
import * as controller from "../controllers/atributosController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import validarEntidade from "../middlewares/validarEntidade.js";
import handleErrors from "../middlewares/handleErrors.js";

// Criar um novo categoria (Funcionario)
router.post("/cadastro/:entidade", authMiddleware, validarEntidade, controller.criar);

// Obter todas as categorias (Funcionario)
router.get("/listar/:entidade", authMiddleware, validarEntidade, controller.obterTodos);

// Atualizar um categoria por ID (Funcionario)
router.put("/atualizar/:entidade/:id", authMiddleware, validarEntidade, controller.editar);

// Deletar uma cátegoria (Funcionario)
router.delete("/deletar/:entidade/:id", authMiddleware, validarEntidade, controller.deletar);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
