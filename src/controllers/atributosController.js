import * as service from "../services/atributosLivroService.js";

export const criar = async (req, res, next) => {
  try {
    await service.criar(req.entidade, req.body);
    return res.status(201).json({ message: `${req.entidade} criado com sucesso` });
  } catch (error) {
    next(error);
  }
};

export const obterTodos = async (req, res, next) => {
  try {
    const { nome, pagina, qtdItensPorPagina = 10 } = req.query;
    const itensPorPagina = Number(qtdItensPorPagina);
    const resultado = await service.obterTodos(req.entidade, nome, pagina, itensPorPagina);
    return res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const editar = async (req, res, next) => {
  try {
    await service.editar(req.entidade, req.params.id, req.body);
    return res.json({ message: `${req.entidade} editado com sucesso` });
  } catch (error) {
    next(error);
  }
};

export const deletar = async (req, res, next) => {
  try {
    await service.deletar(req.entidade, Number(req.params.id));
    return res.json({ message: `${req.entidade} deletado com sucesso` });
  } catch (error) {
    next(error);
  }
};
