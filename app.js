import express from "express";

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
  }

  routes() {
    this.app.use("/cliente", clienteRoutes);
    this.app.use("/admin", adminRoutes);
    this.app.use("/funcionario", funcionarioRoutes);
    this.app.use("/livro", atributosRoutes);
    this.app.use("/livro", livroRoutes);
    this.app.use("/emprestimo", emprestimoRoutes);
  }
}

export default new App().app;
