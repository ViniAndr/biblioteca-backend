import * as adminService from "../services/adminService.js";

// metodo auxiliar para lidar com a resposta de erros
function lidarComErros(error, res) {
  // Resposta de erro personalizada
  if (error.statusCode && error.statusCode != 500) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  // log do erro
  console.log(error);
  // Erro genérico
  return res.status(500).json({
    error: "Ocorreu um erro, tente novamente mais tarde",
  });
}

export const criarConta = async (req, res) => {
  try {
    await adminService.criarContaPadrao();
    return res.status(201).json({ mensagem: "Administrador cadastrado com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const login = async (req, res) => {
  try {
    const token = await adminService.loginConta(req.body);
    return res.status(200).json({
      message: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const verPerfil = async (req, res) => {
  const adminId = req.usuarioId;
  try {
    const adminPerfil = await adminService.perfil(adminId);
    return res.status(200).json(adminPerfil);
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const atualizarPerfil = async (req, res) => {
  const adminId = req.usuarioId;
  try {
    await adminService.atualizarDados(adminId, req.body);
    res.status(200).json({ mensagem: "Dados atualizado com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const resetDeConta = async (req, res) => {
  const adminId = req.usuarioId;
  try {
    await adminService.resetarDados(adminId);
    res.status(200).json({ mensagem: "Conta resetada com sucesso" });
  } catch (error) {
    lidarComErros(error, res);
  }
};
