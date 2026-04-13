-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('SOLICITADO', 'CANCELADO', 'EMPRESTADO', 'DEVOLVIDO', 'ATRASADO');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "senha" TEXT,
    "telefone" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cliente',

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'funcionario',
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livro" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "qtdCopias" INTEGER NOT NULL DEFAULT 1,
    "qtdDisponivel" INTEGER NOT NULL DEFAULT 1,
    "edicao" INTEGER NOT NULL DEFAULT 1,
    "descricao" TEXT,
    "numeroPagina" INTEGER,
    "capa" TEXT NOT NULL DEFAULT '',
    "capaPequena" TEXT NOT NULL DEFAULT '',
    "publicadoEm" TIMESTAMP(3),
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "deletadoEm" TIMESTAMP(3),
    "estante" TEXT,
    "prateleira" TEXT,
    "autorId" INTEGER NOT NULL,
    "editoraId" INTEGER NOT NULL,

    CONSTRAINT "Livro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" SERIAL NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'SOLICITADO',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazoRetirada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEmprestimo" TIMESTAMP(3),
    "prazoDevolucao" TIMESTAMP(3),
    "dataDevolucao" TIMESTAMP(3),
    "estadoDevolucao" TEXT,
    "dataCancelamento" TIMESTAMP(3),
    "renovacoes" INTEGER NOT NULL DEFAULT 0,
    "clienteId" INTEGER NOT NULL,
    "funcionarioId" INTEGER,
    "livroId" INTEGER NOT NULL,

    CONSTRAINT "Emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Editora" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Editora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Autor" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Autor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LivroCategorias" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LivroCategorias_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefone_key" ON "Cliente"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_email_key" ON "Funcionario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Livro_isbn_key" ON "Livro"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "Livro_titulo_isbn_key" ON "Livro"("titulo", "isbn");

-- CreateIndex
CREATE UNIQUE INDEX "Emprestimo_clienteId_livroId_dataEmprestimo_key" ON "Emprestimo"("clienteId", "livroId", "dataEmprestimo");

-- CreateIndex
CREATE UNIQUE INDEX "Editora_nome_key" ON "Editora"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Autor_nome_key" ON "Autor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE INDEX "_LivroCategorias_B_index" ON "_LivroCategorias"("B");

-- AddForeignKey
ALTER TABLE "Livro" ADD CONSTRAINT "Livro_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Autor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livro" ADD CONSTRAINT "Livro_editoraId_fkey" FOREIGN KEY ("editoraId") REFERENCES "Editora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LivroCategorias" ADD CONSTRAINT "_LivroCategorias_A_fkey" FOREIGN KEY ("A") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LivroCategorias" ADD CONSTRAINT "_LivroCategorias_B_fkey" FOREIGN KEY ("B") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
