-- CreateTable
CREATE TABLE "site_config" (
    "id" SERIAL NOT NULL,
    "sobreTexto" TEXT,
    "missao" TEXT,
    "visao" TEXT,
    "valores" TEXT,
    "estatutos" TEXT,
    "bannerUrl" TEXT,
    "bannerAlt" TEXT,
    "mostrarEnquetes" BOOLEAN NOT NULL DEFAULT true,
    "mostrarNoticias" BOOLEAN NOT NULL DEFAULT true,
    "mostrarEventos" BOOLEAN NOT NULL DEFAULT true,
    "linksRapidos" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticias" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "conteudo" TEXT,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);
