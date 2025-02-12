export default (papelMinimo) => {
  return (req, res, next) => {
    const papel = req.usuarioRole;

    const niveisAcesso = {
      cliente: 1,
      funcionario: 2,
      admin: 3,
    };

    if (!papel || niveisAcesso[papel] < niveisAcesso[papelMinimo]) {
      return res.status(403).json({ erro: "Acesso negado." });
    }

    next();
  };
};
