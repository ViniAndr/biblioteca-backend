import * as livroService from "../services/livroService.js";

export const cadastrado = async (req, res, next) => {
  try {
    await livroService.cadastrado(req.body, req.file?.path, req.file?.pequena);

    return res.status(200).json({
      mensagem: "Livro cadastrado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

export const atualizar = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    await livroService.atualizar(id, req.body);
    return res.status(200).json({ mensagem: "Livro atualizado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const deletar = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    await livroService.deletar(id);
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
  const id = Number(req.params.id);
  try {
    const livro = await livroService.obterLivro(id);
    return res.status(200).json(livro);
  } catch (error) {
    next(error);
  }
};

export const buscarLivroGoogle = async (req, res, next) => {
  const isbn = Number(req.params.isbn);

  try {
    const livro = await livroService.buscarLivroGoogle(isbn);
    return res.status(200).json(livro);
  } catch (error) {
    next(error);
  }
};
