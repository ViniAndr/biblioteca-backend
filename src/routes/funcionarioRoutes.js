import { Router } from "express";
const router = Router();

// controller
import * as funcionarioController from "../controllers/funcionarioController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";

// Criar conta, que é feito apenas pelo ADMIN
router.post("/cadastro", authMiddleware, funcionarioController.criarConta);

// Login
router.post("/login", funcionarioController.login);

// Alterar dados da conta
router.put("/atualizar", authMiddleware, funcionarioController.atualizarPerfil);

// Ver perfil
router.get("/perfil", authMiddleware, funcionarioController.verPerfil);

// Obter todos os funcionarios - ADMIN
router.get("/listar", authMiddleware, funcionarioController.listarTodos);

// Obter dados de um funcionario - ADMIN
router.get("/:id", authMiddleware, funcionarioController.obterPorId);

// Desativar/Deletar conta, feita apenas pelo ADMIN
// deixo ID opcional na tebal emprestimo?
// em vez de deletar apenas desativar?

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
