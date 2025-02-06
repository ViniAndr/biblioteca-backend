import express from "express";

// Middleware
import handleErrors from "./src/middlewares/handleErrors.js";

// Routes
import clienteRoutes from "./src/routes/clienteRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import funcionarioRoutes from "./src/routes/funcionarioRoutes.js";
import atributosRoutes from "./src/routes/atributosRoutes.js";

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
  }
}

export default new App().app;
