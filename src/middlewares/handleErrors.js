export default (error, req, res, next) => {
  if (error.statusCode && error.statusCode !== 500) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Ocorreu um erro, tente novamente mais tarde" });
};
