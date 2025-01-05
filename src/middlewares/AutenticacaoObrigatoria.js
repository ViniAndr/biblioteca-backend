// Função dele é ser usado para verificar se ao usar uma rota o usuario está logado

export default async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ mensagem: "Acesso negado." });

  try {
    console.log(authorization);
    const [bearer, token] = authorization.split("");

    // aqui decodificamos o token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (!decoded) return res.status(401).json("Token invalido");

    // Deixamos esses dados disponíveis para as rotas
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    return next();
  } catch (error) {
    console.error(error.message);
    return res.status(401).json("Autenticação obrigatoria.");
  }
};
