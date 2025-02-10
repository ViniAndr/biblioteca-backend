import * as livroService from "../services/livroService.js";

export const cadastrado = async (req, res, next) => {
  try {
    await livroService.cadastrado(req.body);

    return res.status(200).json({
      mensagem: "Livro cadastrado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

export const atualizar = async (req, res, next) => {
  try {
    await livroService.atualizar(req.params.id, req.body);
    return res.status(200).json({ mensagem: "Livro atualizado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const deletar = async (req, res, next) => {
  try {
    await livroService.deletar(req.params.id);
    return res.status(200).json({ mensagem: "Livro deletado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const listarTodos = async (req, res, next) => {
  // Parametros opcionais para FILTROS
  const { titulo, autor, editora, categoria, pagina, qtdItensPorPagina = 10 } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);
  try {
    const livros = await livroService.verTodosLivvros(titulo, autor, editora, categoria, pagina, itensPorPagina);
    return res.status(200).json(livros);
  } catch (error) {
    next(error);
  }
};

export const obterPorId = async (req, res, next) => {
  try {
    const livro = await livroService.obterLivro(req.params.id);
    return res.status(200).json(livro);
  } catch (error) {
    next(error);
  }
};
