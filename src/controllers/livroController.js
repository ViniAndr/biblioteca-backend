import * as livroService from "../services/livroService.js";

export const cadastrado = async (req, res, next) => {
  // Se o Multer processou uma imagem nova (arquivo do PC), injetamos os caminhos dela no body
  if (req.file) {
    req.body.capa = req.file.path;
    req.body.capaPequena = req.file.pequena;
  }

  try {
    // Agora passamos apenas o req.body. O Service vai se virar com o que estiver lá.
    await livroService.cadastrado(req.body);

    return res.status(200).json({
      mensagem: "Livro cadastrado com sucesso",
    });
  } catch (error) {
    next(error);
  }
};

export const atualizar = async (req, res, next) => {
  const id = Number(req.params.id);

  // Se o Multer processou uma imagem nova, injetamos os caminhos dela no body
  if (req.file) {
    req.body.capa = req.file.path;
    req.body.capaPequena = req.file.pequena;
  }

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

export const reativar = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    await livroService.reativar(id);
    return res.status(200).json({ mensagem: "Livro reativado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const listarTodos = async (req, res, next) => {
  // Parametros opcionais para FILTROS
  const { titulo, autor, editora, categoria, pagina, qtdItensPorPagina = 10, status } = req.query;
  const itensPorPagina = Number(qtdItensPorPagina);
  try {
    const livros = await livroService.verTodosLivros(titulo, autor, editora, categoria, pagina, itensPorPagina, status);
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

export const topLivrosEmprestados = async (req, res, next) => {
  try {
    const topLivros = await livroService.listarLivrosMaisEmprestados();
    return res.status(200).json(topLivros);
  } catch (error) {
    next(error);
  }
};
