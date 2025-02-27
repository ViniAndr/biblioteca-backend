export default (papelMinimo, apenasCliente = false) => {
  return (req, res, next) => {
    const papel = req.usuarioRole;

    const niveisAcesso = {
      cliente: 1,
      funcionario: 2,
      admin: 3,
    };

    // Se a rota for exclusiva para clientes, verifica se o papel é exatamente 'cliente'
    if (apenasCliente && papel !== "cliente") {
      return res.status(403).json({ erro: "Acesso restrito a clientes." });
    }

    // Mantém a lógica original para os demais níveis de acesso
    if (!papel || niveisAcesso[papel] < niveisAcesso[papelMinimo]) {
      return res.status(403).json({ erro: "Acesso negado." });
    }

    next();
  };
};
