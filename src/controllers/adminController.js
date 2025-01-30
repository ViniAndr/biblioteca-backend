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
