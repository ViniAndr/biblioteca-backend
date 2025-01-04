import express from "express";

// Routes
import clienteRoutes from "./src/routes/clienteRoutes.js";

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
  }
}

export default new App().app;
