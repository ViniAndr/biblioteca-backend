import multer from "multer";
import path from "path";

// Configuração do armazenamento
const armazenar = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/capas/"); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname); // Extensão do arquivo
    const nomeArquivo = `${Date.now()}${extensao}`; // Nome único para evitar conflitos
    cb(null, nomeArquivo);
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const tiposPermitios = ["image/jpeg", "image/png", "image/jpg"];
  if (tiposPermitios.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo inválido. Apenas JPEG, PNG e JPG são permitidos."));
  }
};

// Middleware do Multer
const carregar = multer({ armazenar, fileFilter });

export default carregar;
