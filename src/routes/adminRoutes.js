import { Router } from "express";
const router = Router();

// controller
import * as adminController from "../controllers/adminController.js";

// midllewares
import autenticacaoObrigatoria from "../middlewares/autenticacaoObrigatoria.js";

// criar conta **SERÁ FEITO PELO DEV, UMA ÚNICA CONTA COM CREDENCIAIS PADRÕES**
router.post("/criar-conta", adminController.criarConta);

// fazer o login na conta
router.post("/login", adminController.login);

// ver perfil
router.get("/perfil", autenticacaoObrigatoria, adminController.verPerfil);

// atualizar dados de registro
router.put("/atualizar-dados", autenticacaoObrigatoria, adminController.atualizarPerfil);

// resetar conta
router.get("/reset", autenticacaoObrigatoria, adminController.resetDeConta);

export default router;
