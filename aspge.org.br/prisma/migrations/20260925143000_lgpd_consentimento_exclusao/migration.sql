-- LGPD: consentimento explícito registrado na inscrição e
-- solicitação de exclusão de dados (direito ao esquecimento)
ALTER TABLE "associados"
  ADD COLUMN "consentimentoLgpd"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentimentoLgpdEm" TIMESTAMP(3),
  ADD COLUMN "solicitouExclusao"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "solicitouExclusaoEm" TIMESTAMP(3);
