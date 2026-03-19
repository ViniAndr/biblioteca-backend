import { Router } from "express";
const router = Router();

// Controller
import * as clienteController from "../controllers/clienteController.js";

// Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

/* Verificar se o cliente já tem um cadastro simples (presencial) e atualizar,
   caso não tenha, realizar o cadastro completo. */
router.post("/verificar-conta", clienteController.verificaCadastroPresencial);

// Cadastro completo online feito pelo cliente
router.post("/online", clienteController.criarContaOnline);

// Cadastro simples presencial feito pelo funcionário
router.post("/presencial", authMiddleware, controleAcesso("funcionario"), clienteController.criarContaPresencial);

// Login do cliente
router.post("/login", clienteController.login);

// Ver dados do perfil do cliente
router.get("/perfil", authMiddleware, controleAcesso("cliente", true), clienteController.verPerfil);

// Atualizar DADOS e ENDEREÇO do perfil do cliente (Tudo em uma rota só!)
router.put("/perfil", authMiddleware, controleAcesso("cliente", true), clienteController.atualizarPerfil);

// Atualizar dados de um cliente (feito pelo funcionário)
router.put("/:id", authMiddleware, controleAcesso("funcionario"), validarId, clienteController.atualizaPorId);

// Listar todos os clientes (funcionário)
router.get("/", authMiddleware, controleAcesso("funcionario"), clienteController.listarTodos);

// Ver dados de um cliente por ID (funcionário)
router.get("/:id", authMiddleware, controleAcesso("funcionario"), validarId, clienteController.obterPorId);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
