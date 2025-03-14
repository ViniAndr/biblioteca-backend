import { Router } from "express";
const router = Router();

// Controller
import * as controller from "../controllers/livroController.js";

// Middlewares
import handleErrors from "../middlewares/handleErrors.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validarId from "../middlewares/validarId.js";
import controleAcesso from "../middlewares/controleAcesso.js";
import { upload, processarImagem } from "../middlewares/uploadMiddleware.js";

// Criar livro
router.post("/", authMiddleware, controleAcesso("funcionario"), upload, processarImagem, controller.cadastrado);

// Editar livro
router.put("/:id", authMiddleware, controleAcesso("funcionario"), validarId, controller.atualizar);

// Desativar livro (Exclusão lógica)
router.patch("/:id/desativar", authMiddleware, controleAcesso("funcionario"), validarId, controller.deletar); // Rota mais semântica

// Listar todos os livros (todos, até não logados)
router.get("/", controller.listarTodos);

// Obter um livro específico
router.get("/:id", validarId, controller.obterPorId);

// Consulta API de livros do Google para obter metadados
router.get("/google/:isbn", authMiddleware, controleAcesso("funcionario"), controller.buscarLivroGoogle); // Rota mais semântica

// Middleware global de tratamento de erros
router.use(handleErrors);

export default router;
