import { Router } from "express";
const router = Router();

// controller
import * as emprestimo from "../controllers/emprestimoController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";

router.post("/solicitar", authMiddleware, emprestimo.solicitar);

router.post("/criar/", authMiddleware, emprestimo.fazerEmprestimo);

router.put("/cancelar-solicitacao/:id", authMiddleware, validarId, emprestimo.cancelarSolicitacao);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
