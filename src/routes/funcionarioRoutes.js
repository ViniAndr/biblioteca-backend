import { Router } from "express";
const router = Router();

// controller
import * as funcionarioController from "../controllers/funcionarioController.js";

// midllewares
import autenticacaoObrigatoria from "../middlewares/autenticacaoObrigatoria.js";

// Criar conta, que é feito apenas pelo ADMIN
router.post("/cadastro", autenticacaoObrigatoria, funcionarioController.criarConta);

// Login
router.post("/login", funcionarioController.login);

// Alterar dados da conta
router.put("/atualizar-dados", autenticacaoObrigatoria, funcionarioController.atualizarPerfil);

// Ver perfil
router.get("/perfil", autenticacaoObrigatoria, funcionarioController.verPerfil);

// Obter todos os funcionarios - ADMIN
router.get("/listar", autenticacaoObrigatoria, funcionarioController.verTodosFuncionarios);

// Obter dados de um funcionario - ADMIN
router.get("/:id", autenticacaoObrigatoria, funcionarioController.consultarPerfil);

// Desativar/Deletar conta, feita apenas pelo ADMIN
// deixo ID opcional na tebal emprestimo?
// em vez de deletar apenas desativar?

export default router;
