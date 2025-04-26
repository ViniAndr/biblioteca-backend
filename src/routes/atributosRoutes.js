import { Router } from "express";
const router = Router();

// controller
import * as controller from "../controllers/atributosController.js";

// middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import validarEntidade from "../middlewares/validarEntidade.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Criar um novo atributo (Funcionario)
router.post("/:entidade", authMiddleware, controleAcesso("funcionario"), validarEntidade, controller.criar);

// Obter todos os atributos (Funcionario)
router.get("/:entidade", authMiddleware, controleAcesso("funcionario"), validarEntidade, controller.obterTodos);

// Atualizar um atributo por ID (Funcionario)
router.put(
  "/:entidade/:id",
  authMiddleware,
  controleAcesso("funcionario"),
  validarEntidade,
  validarId,
  controller.editar
);

// Deletar um atributo por ID (Funcionario)
router.delete(
  "/:entidade/:id/deletar",
  authMiddleware,
  controleAcesso("funcionario"),
  validarEntidade,
  validarId,
  controller.deletar
);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
