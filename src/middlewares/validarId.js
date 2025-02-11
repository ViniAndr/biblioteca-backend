export default (req, res, next) => {
  const { id } = req.params;
  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ erro: "ID inválido." });
  }
  next();
};
