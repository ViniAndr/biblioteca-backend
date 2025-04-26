import jwt from "jsonwebtoken";

// Gerar um token com algumas informações do usuario
const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: process.env.TOKEN_EXPIRATION,
    }
  );
};

export default gerarToken;
