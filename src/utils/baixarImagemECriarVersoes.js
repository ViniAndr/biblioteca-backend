import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pastaUploads = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

export async function baixarImagemECriarVersoes(urlImagem) {
  const timestamp = Date.now();
  const nomeArquivo = `${timestamp}-${Math.round(Math.random() * 1e9)}`;
  const caminhoGrande = path.join(pastaUploads, `${nomeArquivo}-grande.jpg`);
  const caminhoPequena = path.join(pastaUploads, `${nomeArquivo}-pequena.jpg`);

  const resposta = await axios.get(urlImagem, { responseType: "arraybuffer" });
  const buffer = Buffer.from(resposta.data, "binary");

  await sharp(buffer).resize({ width: 575 }).jpeg({ quality: 70 }).toFile(caminhoGrande);
  await sharp(buffer).resize(300, 450, { fit: "cover" }).jpeg({ quality: 100 }).toFile(caminhoPequena);

  return {
    capa: `/api/uploads/${nomeArquivo}-grande.jpg`,
    capaPequena: `/api/uploads/${nomeArquivo}-pequena.jpg`,
  };
}
