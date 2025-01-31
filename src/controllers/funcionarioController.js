import * as funcionarioService from "../services/funcionarioService.js";

// Depois refatorar esse método
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
    // queremos ver esses dados ao serem criados
    const novoFuncionario = await funcionarioService.cadastrarFuncionario();
    return res.status(201).json({
      message: "Novo funcionario cadastrado com sucesso",
      novoFuncionario,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const login = async (req, res) => {
  try {
    const token = await funcionarioService.loginConta(req.body);
    return res.status(200).json({
      message: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

// método para o proprio funcionario ver seu perfil
export const verPerfil = async (req, res) => {
  const funcionarioId = req.usuarioId;
  try {
    const dados = await funcionarioService.perfil(funcionarioId);
    res.status(200).json(dados);
  } catch (error) {
    lidarComErros(error, res);
  }
};

// Método para o proprio funcionario atualizar seu perfil
export const atualizarPerfil = async (req, res) => {
  const funcionarioId = req.usuarioId;
  try {
    await funcionarioService.atualizarDados(funcionarioId, req.body);
    res.status(200).json({
      message: "Dados atualizado com sucesso",
    });
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const verTodosFuncionarios = async (req, res) => {
  // Parametros opcionais para FILTROS
  const { pagina, nomeCliente, qtdItensPorPagina } = req.query;
  const qtdItensPorPaginaAtual = qtdItensPorPagina ? Number(qtdItensPorPagina) : 10;
  try {
    const funcionarios = await funcionarioService.obterFuncionarios(pagina, nomeCliente, qtdItensPorPaginaAtual);
    res.status(200).json(funcionarios);
  } catch (error) {
    lidarComErros(error, res);
  }
};

export const consultarPerfil = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const funcionario = await funcionarioService.perfil(id);
    res.status(200).json(funcionario);
  } catch (error) {
    lidarComErros(error, res);
  }
};
