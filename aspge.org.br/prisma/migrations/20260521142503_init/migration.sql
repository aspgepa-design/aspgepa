-- CreateTable
CREATE TABLE "associados" (
    "id" SERIAL NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "expeditor" TEXT,
    "matricula" TEXT,
    "cargo" TEXT,
    "perfil" TEXT NOT NULL DEFAULT 'Associado',
    "situacao" TEXT,
    "sexo" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "senha" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "naturalidade" TEXT,
    "estadoCivil" TEXT,
    "graduacao" TEXT,
    "posGraduacao" TEXT,
    "areaAtuacao" TEXT,
    "lotacao" TEXT,
    "fotoUrl" TEXT,
    "fotoCarteirinhaUrl" TEXT,
    "fotoConfig" TEXT,
    "cadastroCompleto" BOOLEAN NOT NULL DEFAULT false,
    "camposPreenchidos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "associados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "local" TEXT,
    "horario" TEXT,
    "descricao" TEXT,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "link" TEXT,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "responsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestoes" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "presidente" TEXT NOT NULL,
    "vicePresidente" TEXT,
    "tesoureiro" TEXT,
    "secretario" TEXT,
    "diretorCultural" TEXT,
    "diretorEsporte" TEXT,
    "diretorJuventude" TEXT,
    "diretorSocio" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gestoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "associadoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "associadoId" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_carteirinhas" (
    "id" SERIAL NOT NULL,
    "config" TEXT NOT NULL,
    "templateFrente" TEXT,
    "templateVerso" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_carteirinhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssociadoToGestao" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "associados_cpf_key" ON "associados"("cpf");

-- CreateIndex
CREATE INDEX "logs_associadoId_idx" ON "logs"("associadoId");

-- CreateIndex
CREATE INDEX "logs_createdAt_idx" ON "logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_AssociadoToGestao_AB_unique" ON "_AssociadoToGestao"("A", "B");

-- CreateIndex
CREATE INDEX "_AssociadoToGestao_B_index" ON "_AssociadoToGestao"("B");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssociadoToGestao" ADD CONSTRAINT "_AssociadoToGestao_A_fkey" FOREIGN KEY ("A") REFERENCES "associados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssociadoToGestao" ADD CONSTRAINT "_AssociadoToGestao_B_fkey" FOREIGN KEY ("B") REFERENCES "gestoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
