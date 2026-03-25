import fs from "fs/promises";
import path from "path";

export const apagarImagensAntigas = async (caminhoCapa, caminhoCapaPequena) => {
  try {
    const raiz = process.cwd(); // Pega a raiz do projeto no servidor

    // Função interna para apagar um único arquivo de forma segura
    const apagar = async (caminhoRelativo) => {
      if (!caminhoRelativo) return;

      // Extrai apenas o nome do arquivo (ex: "123-grande.jpg" de "/uploads/123-grande.jpg")
      const nomeArquivo = path.basename(caminhoRelativo);
      const caminhoAbsoluto = path.resolve(raiz, "uploads", nomeArquivo);

      try {
        await fs.unlink(caminhoAbsoluto);
        console.log(`🗑️ Arquivo apagado: ${nomeArquivo}`);
      } catch (e) {
        // Ignora o erro se o arquivo já não existir fisicamente no HD
        if (e.code !== "ENOENT") console.error(`Erro ao apagar ${nomeArquivo}:`, e);
      }
    };

    // Tenta apagar as duas versões da imagem
    await apagar(caminhoCapa);
    await apagar(caminhoCapaPequena);
  } catch (error) {
    console.error("Erro geral ao tentar limpar imagens órfãs:", error);
  }
};
