import { Router } from "express";
const router = Router();

// controller
import * as clienteController from "../controllers/clienteController.js";

// midllewares
import authMiddleware from "../middlewares/authMiddleware.js";
import handleErrors from "../middlewares/handleErrors.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";

/* verifica se o CLIENTE já tem o cadastro simples e atualiza adicionando o email e senha,
   caso não tenha, ele fará um cadastro completo. */
router.post("/verificar-conta", clienteController.verificaCadastroPresencial);

// cadastro completo, ou seja, o online feito pelo cliente.
router.post("/cadastro-online", clienteController.criarContaOnline);

// cadastro simples, ou seja, o presencial feito pelo funcionario
router.post(
  "/cadastro-presencial",
  authMiddleware,
  controleAcesso("funcionario"),
  clienteController.criarContaPresencial
);

// login do cliente
router.post("/login", clienteController.login);

// ver seus dados (PERFIL)
router.get("/perfil", authMiddleware, controleAcesso("cliente", true), clienteController.verPerfil);

// atualizar seus dados de regsitro (email, senha, telefone e nome)
router.put("/atualizar-dados", authMiddleware, controleAcesso("cliente", true), clienteController.atualizarPerfil);

// atualizar seus dados de endereço
router.put("/atualizar-endereco", authMiddleware, controleAcesso("cliente", true), clienteController.atualizarEndereco);

// atualizar todos os dados do cliente, porem quem faz isso é o funcionario.
router.put(
  "/atualizar-cliente/:id",
  authMiddleware,
  controleAcesso("funcionario"),
  validarId,
  clienteController.atualizaPorId
);

// listar todos os clientes (Funcionario).
router.get("/listar", authMiddleware, controleAcesso("funcionario"), clienteController.listarTodos);

// ver informações de um cliente por ID (Funcionario).
router.get("/:id", validarId, controleAcesso("funcionario"), clienteController.obterPorId);

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
