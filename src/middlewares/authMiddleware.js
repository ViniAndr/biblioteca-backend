// A função dele é ser usado para verificar se ao usar uma rota o usuario está logado
import jwt from "jsonwebtoken";

export default async (req, res, next) => {
  const { authorization } = req.headers;

  // Verifica se o header de autorização está presente
  if (!authorization) {
    return res.status(401).json({ mensagem: "Acesso negado" });
  }

  try {
    const [bearer, token] = authorization.split(" ");

    // aqui decodificamos o token
    const decodificado = jwt.verify(token, process.env.TOKEN_SECRET);
    if (!decodificado) return res.status(401).json("Token invalido");

    // Deixamos esses dados disponíveis para as rotas
    req.usuarioId = decodificado.id;
    req.usuarioEmail = decodificado.email;
    req.usuarioRole = decodificado.role;

    return next();
  } catch (error) {
    return res.status(401).json("Autorização necessária");
  }
};
