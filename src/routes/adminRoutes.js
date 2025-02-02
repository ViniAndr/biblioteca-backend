import { Router } from "express";
const router = Router();

// controller
import * as adminController from "../controllers/adminController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";

// criar conta **SERÁ FEITO PELO DEV, UMA ÚNICA CONTA COM CREDENCIAIS PADRÕES**
router.post("/cadastro", adminController.criarConta);

// fazer o login na conta
router.post("/login", adminController.login);

// ver perfil
router.get("/perfil", authMiddleware, adminController.verPerfil);

// atualizar dados de registro
router.put("/atualizar", authMiddleware, adminController.atualizarPerfil);

// resetar conta
router.get("/resetar-conta", authMiddleware, adminController.resetarConta);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
