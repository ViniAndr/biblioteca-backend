-- AlterTable
ALTER TABLE "Emprestimo" ADD COLUMN     "qtdAtrasos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimaRenovacao" TIMESTAMP(3);
