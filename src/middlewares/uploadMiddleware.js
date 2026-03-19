import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import sharp from "sharp";

// Corrigir o __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar a pasta de uploads se não existir
const pastaUploads = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

// Configuração do Multer (Armazena a imagem na memória para processar)
const armazenamento = multer.memoryStorage(); // Armazena na memória para processar antes de salvar

const upload = multer({
  storage: armazenamento,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB máximo
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png"];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error("Apenas imagens JPEG e PNG são permitidas."));
    }
    cb(null, true);
  },
}).single("capa"); // O nome do campo deve ser "capa" no formulário

// Middleware de processamento com Sharp
const processarImagem = async (req, res, next) => {
  const capa = req.body.capa;

  if (capa && typeof capa === "string") {
    // REGRA DE OURO: Só passa se for um link da web OU o nosso caminho oficial do sistema
    const ehLinkValido = capa.startsWith("http://") || capa.startsWith("https://");
    const ehCaminhoLocal = capa.startsWith("/api/uploads/");

    if (ehLinkValido || ehCaminhoLocal) {
      req.file = {
        path: capa,
        pequena: req.body.capaPequena || capa,
      };
      return next();
    } else {
      // Se mandou "blablabla", o segurança barra aqui e devolve Erro 400 na cara!
      return res.status(400).json({ erro: "Caminho ou URL de imagem inválido." });
    }
  }

  if (!req.file) {
    return res.status(400).json({ erro: "Nenhuma imagem enviada." });
  }

  try {
    const timestamp = Date.now();
    const nomeArquivo = `${timestamp}-${Math.round(Math.random() * 1e9)}`;

    // Caminho da imagem grande
    const caminhoGrande = path.join(pastaUploads, `${nomeArquivo}-grande.jpg`);
    // Caminho da imagem pequena
    const caminhoPequena = path.join(pastaUploads, `${nomeArquivo}-pequena.jpg`);

    // Criar imagem grande
    await sharp(req.file.buffer).resize({ width: 575 }).jpeg({ quality: 70 }).toFile(caminhoGrande);

    // Criar imagem pequena (300x450)
    await sharp(req.file.buffer).resize(300, 450, { fit: "cover" }).jpeg({ quality: 100 }).toFile(caminhoPequena);

    // Atualizar os caminhos no req.file
    req.file.filename = nomeArquivo;
    req.file.path = `/api/uploads/${nomeArquivo}-grande.jpg`;
    req.file.pequena = `/api/uploads/${nomeArquivo}-pequena.jpg`;

    next();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao processar imagem." });
  }
};

export { upload, processarImagem };
