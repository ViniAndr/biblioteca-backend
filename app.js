import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// Middleware
import handleErrors from "./src/middlewares/handleErrors.js";

// Routes
import clienteRoutes from "./src/routes/clienteRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import funcionarioRoutes from "./src/routes/funcionarioRoutes.js";
import atributosRoutes from "./src/routes/atributosRoutes.js";
import livroRoutes from "./src/routes/livroRoutes.js";
import emprestimoRoutes from "./src/routes/emprestimoRoutes.js";

// Cron Jobs
import "./src/jobs/cancelarSolicitacoes.js";
import "./src/jobs/verificarVencimentos.js";

// Corrigir o __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(handleErrors); // Middleware de erro global
    // Tornar a pasta uploads estática para ser servida
    this.app.use("/api/uploads", express.static(path.resolve(__dirname, "src", "uploads")));
    this.app.use(cors());
  }

  routes() {
    this.app.use("/api/clientes", clienteRoutes);
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/funcionarios", funcionarioRoutes);
    this.app.use("/api/livros/atributos", atributosRoutes);
    this.app.use("/api/livros", livroRoutes);
    this.app.use("/api/emprestimos", emprestimoRoutes);
  }
}

export default new App().app;
