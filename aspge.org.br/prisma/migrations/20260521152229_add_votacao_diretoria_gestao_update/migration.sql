/*
  Warnings:

  - You are about to drop the column `ano` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `diretorCultural` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `diretorEsporte` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `diretorJuventude` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `diretorSocio` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `presidente` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `secretario` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `tesoureiro` on the `gestoes` table. All the data in the column will be lost.
  - You are about to drop the column `vicePresidente` on the `gestoes` table. All the data in the column will be lost.
  - Added the required column `nome` to the `gestoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gestoes" DROP COLUMN "ano",
DROP COLUMN "diretorCultural",
DROP COLUMN "diretorEsporte",
DROP COLUMN "diretorJuventude",
DROP COLUMN "diretorSocio",
DROP COLUMN "presidente",
DROP COLUMN "secretario",
DROP COLUMN "tesoureiro",
DROP COLUMN "vicePresidente",
ADD COLUMN     "fim" TIMESTAMP(3),
ADD COLUMN     "inicio" TIMESTAMP(3),
ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "votacoes" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "dataFim" TEXT,
    "votos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diretoria_gestao" (
    "id" SERIAL NOT NULL,
    "gestaoId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,

    CONSTRAINT "diretoria_gestao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "diretoria_gestao" ADD CONSTRAINT "diretoria_gestao_gestaoId_fkey" FOREIGN KEY ("gestaoId") REFERENCES "gestoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
