import { Router } from "express";
const router = Router();

// Controller
import * as adminController from "../controllers/adminController.js";

// Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import controleAcesso from "../middlewares/controleAcesso.js";

// Criar conta (Apenas uma única conta com credenciais padrões, feito pelo DEV)
router.post("/", adminController.criarConta);

// Fazer login na conta
router.post("/login", adminController.login);

// Ver perfil do administrador
router.get("/perfil", authMiddleware, controleAcesso("admin"), adminController.verPerfil);

// Atualizar dados de registro
router.put("/perfil", authMiddleware, controleAcesso("admin"), adminController.atualizarPerfil);

// Resetar conta do administrador
router.patch("/reset", authMiddleware, controleAcesso("admin"), adminController.resetarConta); // alterado para patch

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
