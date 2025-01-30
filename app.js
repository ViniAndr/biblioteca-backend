import express from "express";

// Routes
import clienteRoutes from "./src/routes/clienteRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/cliente", clienteRoutes);
    this.app.use("/admin", adminRoutes);
  }
}

export default new App().app;
