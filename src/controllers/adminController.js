import * as adminService from "../services/adminService.js";

export const criarConta = async (req, res, next) => {
  try {
    await adminService.cadastrar();
    return res.status(201).json({ mensagem: "Administrador cadastrado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const token = await adminService.login(req.body);
    return res.status(200).json({
      mensagem: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const verPerfil = async (req, res, next) => {
  const adminId = req.usuarioId;
  try {
    const adminPerfil = await adminService.obterPerfil(adminId);
    return res.status(200).json(adminPerfil);
  } catch (error) {
    next(error);
  }
};

export const atualizarPerfil = async (req, res, next) => {
  const adminId = req.usuarioId;
  try {
    await adminService.atualizarDados(adminId, req.body);
    res.status(200).json({ mensagem: "Dados atualizados com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const resetarConta = async (req, res, next) => {
  const adminId = req.usuarioId;
  try {
    await adminService.resetarDados(adminId);
    res.status(200).json({ mensagem: "Conta resetada com sucesso" });
  } catch (error) {
    next(error);
  }
};
