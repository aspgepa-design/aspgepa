-- Associado.senha passa a ser opcional (associado define no primeiro acesso)
ALTER TABLE "associados" ALTER COLUMN "senha" DROP NOT NULL;

-- Votação real: opções e votos
CREATE TABLE "opcoes_voto" (
    "id" SERIAL NOT NULL,
    "votacaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    CONSTRAINT "opcoes_voto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "votos" (
    "id" SERIAL NOT NULL,
    "votacaoId" INTEGER NOT NULL,
    "opcaoId" INTEGER NOT NULL,
    "associadoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- Inscrição de associados em eventos
CREATE TABLE "inscricoes_evento" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "associadoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inscricoes_evento_pkey" PRIMARY KEY ("id")
);

-- Dependentes/agregados do associado
CREATE TABLE "dependentes" (
    "id" SERIAL NOT NULL,
    "associadoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dependentes_pkey" PRIMARY KEY ("id")
);

-- Índices e unicidade
CREATE UNIQUE INDEX "votos_votacaoId_associadoId_key" ON "votos"("votacaoId", "associadoId");
CREATE INDEX "votos_opcaoId_idx" ON "votos"("opcaoId");
CREATE UNIQUE INDEX "inscricoes_evento_eventoId_associadoId_key" ON "inscricoes_evento"("eventoId", "associadoId");
CREATE INDEX "inscricoes_evento_associadoId_idx" ON "inscricoes_evento"("associadoId");
CREATE INDEX "dependentes_associadoId_idx" ON "dependentes"("associadoId");

-- Chaves estrangeiras
ALTER TABLE "opcoes_voto" ADD CONSTRAINT "opcoes_voto_votacaoId_fkey" FOREIGN KEY ("votacaoId") REFERENCES "votacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votos" ADD CONSTRAINT "votos_votacaoId_fkey" FOREIGN KEY ("votacaoId") REFERENCES "votacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votos" ADD CONSTRAINT "votos_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "opcoes_voto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votos" ADD CONSTRAINT "votos_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inscricoes_evento" ADD CONSTRAINT "inscricoes_evento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inscricoes_evento" ADD CONSTRAINT "inscricoes_evento_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dependentes" ADD CONSTRAINT "dependentes_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
