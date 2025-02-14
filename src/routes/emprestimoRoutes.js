import { Router } from "express";
const router = Router();

// controller
import * as emprestimo from "../controllers/emprestimoController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";

router.post("/solicitar/:id", authMiddleware, validarId, emprestimo.solicitar);

router.post("/criar/", authMiddleware, emprestimo.fazerEmprestimo);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
