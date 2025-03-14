import * as funcionarioService from "../services/funcionarioService.js";

export const criarConta = async (req, res, next) => {
  try {
    // queremos ver esses dados ao serem criados
    const novoFuncionario = await funcionarioService.cadastrar(req.body.senha);
    return res.status(201).json({
      mensagem: "Funcionário cadastrado com sucesso",
      novoFuncionario,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const token = await funcionarioService.login(req.body);
    return res.status(200).json({
      mensagem: "Login feito com sucesso",
      token,
    });
  } catch (error) {
    next(error);
  }
};

// método para o proprio funcionario ver seu perfil
export const verPerfil = async (req, res, next) => {
  const funcionarioId = Number(req.usuarioId);
  try {
    const dados = await funcionarioService.obterPerfil(funcionarioId);
    res.status(200).json(dados);
  } catch (error) {
    next(error);
  }
};

// Método para o proprio funcionario atualizar seu perfil
export const atualizarPerfil = async (req, res, next) => {
  const funcionarioId = Number(req.usuarioId);
  try {
    await funcionarioService.atualizarDados(funcionarioId, req.body);
    res.status(200).json({
      mensagem: "Dados atualizados com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

export const listarTodos = async (req, res, next) => {
  // Parametros opcionais para FILTROS
  const { pagina, nomeCliente, qtdItensPorPagina = 10 } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);
  try {
    const funcionarios = await funcionarioService.obterFuncionarios(pagina, nomeCliente, itensPorPagina);
    res.status(200).json(funcionarios);
  } catch (error) {
    next(error);
  }
};

export const obterPorId = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const funcionario = await funcionarioService.obterPerfil(id);
    res.status(200).json(funcionario);
  } catch (error) {
    next(error);
  }
};

export const ativarDesativarFuncionario = async (req, res, next) => {
  const funcionarioId = Number(req.params.id);
  try {
    const status = await funcionarioService.alterarStatusFuncionario(funcionarioId, req.body.senha);
    console.log(status);
    res.status(200).json({ mensagem: `${status.ativo ? "Ativação" : "Desativação"} realizada com sucesso.` });
  } catch (error) {
    next(error);
  }
};
