import { Router } from "express";
const router = Router();

import * as clienteController from "../controllers/clienteController.js";

/* verifica se o CLIENTE já tem o cadastro simples e atualiza adicionando o email e senha,
   caso não tenha, ele fará um cadastro completo. */

// cadastro completo, ou seja, o online feito pelo cliente.
router.post("/cadastro-completo", clienteController.cadastroOnline);

// cadastro simples, ou seja, o presencial feito pelo funcionario
router.post("/cadastro-simples", clienteController.cadastroPresencial);

// login do cliente

// ver seus dados (PERFIL)

// atualizar seus dados de regsitro (email, senha, telefone e nome)

// atualizar seus dados de endereço

// atualizar todos os dados do cliente, porem quem faz isso é o funcionario.

// listar todos os clientes (Funcionario).

// ver informações de um cliente por ID (Funcionario).

export default router;
