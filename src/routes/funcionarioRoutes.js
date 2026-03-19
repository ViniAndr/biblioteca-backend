import { Router } from "express";
const router = Router();

// Controller
import * as funcionarioController from "../controllers/funcionarioController.js";

// Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Criar funcionário (Apenas ADMIN)
router.post("/", authMiddleware, controleAcesso("admin"), funcionarioController.criarConta);

// Login
router.post("/login", funcionarioController.login);

// Alterar dados do próprio perfil
router.put("/perfil", authMiddleware, controleAcesso("funcionario"), funcionarioController.atualizarPerfil);

// Obter dados do próprio perfil
router.get("/perfil", authMiddleware, controleAcesso("funcionario"), funcionarioController.verPerfil);

// Obter todos os funcionários (Apenas ADMIN)
router.get("/", authMiddleware, controleAcesso("admin"), funcionarioController.listarTodos);

// Obter dados de um funcionário específico (Apenas ADMIN)
router.get("/:id", authMiddleware, validarId, controleAcesso("admin"), funcionarioController.obterPorId);

// Ativar ou desativar funcionário (Apenas ADMIN)
router.patch(
  "/:id/status",
  authMiddleware,
  validarId,
  controleAcesso("admin"),
  funcionarioController.ativarDesativarFuncionario
);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
