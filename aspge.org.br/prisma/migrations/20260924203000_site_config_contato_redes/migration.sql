-- SiteConfig: contato e redes sociais editáveis via admin
ALTER TABLE "site_config"
  ADD COLUMN "contatoEndereco" TEXT,
  ADD COLUMN "contatoEmail" TEXT,
  ADD COLUMN "contatoTelefone" TEXT,
  ADD COLUMN "redesSociais" TEXT;
