const entidadesPermitidas = ["autor", "categoria", "editora"];

export default (req, res, next) => {
  const { entidade } = req.params;

  if (!entidadesPermitidas.includes(entidade)) {
    return res.status(400).json({ error: "Entidade inválida" });
  }

  req.entidade = entidade;
  next();
};
