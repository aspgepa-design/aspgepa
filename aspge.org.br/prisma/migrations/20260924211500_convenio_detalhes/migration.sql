-- Convenio: campos para página de detalhe com informações completas e condições
ALTER TABLE "convenios"
  ADD COLUMN "numeroConvenio" TEXT,
  ADD COLUMN "desconto" TEXT,
  ADD COLUMN "endereco" TEXT,
  ADD COLUMN "cnpj" TEXT,
  ADD COLUMN "telefone" TEXT,
  ADD COLUMN "condicoes" TEXT,
  ADD COLUMN "comoUsar" TEXT,
  ADD COLUMN "vigencia" TEXT;
