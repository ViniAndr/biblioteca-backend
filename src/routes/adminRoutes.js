import { Router } from "express";
const router = Router();

// controller
import * as adminController from "../controllers/adminController.js";

// midllewares
import autenticacaoObrigatoria from "../middlewares/autenticacaoObrigatoria.js";

// criar conta **SERÁ FEITO PELO DEV, UMA ÚNICA CONTA COM CREDENCIAIS PADRÕES**
router.post("/criar-conta", adminController.criarConta);

// ver perfil

// atualizar dados de registro

// resetar conta

export default router;
