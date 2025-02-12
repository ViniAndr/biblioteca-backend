import { Router } from "express";
const router = Router();

// controller
import * as controller from "../controllers/atributosController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import validarEntidade from "../middlewares/validarEntidade.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Criar um novo categoria (Funcionario)
router.post("/cadastro/:entidade", authMiddleware, controleAcesso("funcionario"), validarEntidade, controller.criar);

// Obter todas as categorias (Funcionario)
router.get("/listar/:entidade", authMiddleware, controleAcesso("funcionario"), validarEntidade, controller.obterTodos);

// Atualizar um categoria por ID (Funcionario)
router.put(
  "/atualizar/:entidade/:id",
  authMiddleware,
  controleAcesso("funcionario"),
  validarEntidade,
  validarId,
  controller.editar
);

// Deletar uma cátegoria (Funcionario)
router.delete(
  "/deletar/:entidade/:id",
  authMiddleware,
  controleAcesso("funcionario"),
  validarEntidade,
  validarId,
  controller.deletar
);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
