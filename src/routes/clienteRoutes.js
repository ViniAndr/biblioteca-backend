import { Router } from "express";
const router = Router();

// controller
import * as clienteController from "../controllers/clienteController.js";

// midllewares
import autenticacaoObrigatoria from "../middlewares/autenticacaoObrigatoria.js";

/* verifica se o CLIENTE já tem o cadastro simples e atualiza adicionando o email e senha,
   caso não tenha, ele fará um cadastro completo. */
router.post("/verificar-conta", clienteController.verificaCadastroPresencial);

// cadastro completo, ou seja, o online feito pelo cliente.
router.post("/cadastro-completo", clienteController.cadastroOnline);

// cadastro simples, ou seja, o presencial feito pelo funcionario
router.post("/cadastro-simples", clienteController.cadastroPresencial);

// login do cliente
router.post("/login", clienteController.login);

// ver seus dados (PERFIL)
router.get("/perfil", autenticacaoObrigatoria, clienteController.perfilClienteLogado);

// atualizar seus dados de regsitro (email, senha, telefone e nome)
router.post("/atualizar-dados", autenticacaoObrigatoria, clienteController.atualizarDados);

// atualizar seus dados de endereço

// atualizar todos os dados do cliente, porem quem faz isso é o funcionario.

// listar todos os clientes (Funcionario).

// ver informações de um cliente por ID (Funcionario).
router.get("/:id", clienteController.consultarDadosDoClientePorId);

export default router;
