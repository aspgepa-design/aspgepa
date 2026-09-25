-- LGPD (art. 48): registro de incidentes de segurança de dados pessoais
-- com trilha de comunicação à ANPD e aos titulares
CREATE TABLE "incidentes_lgpd" (
  "id"                    SERIAL PRIMARY KEY,
  "titulo"                TEXT NOT NULL,
  "descricao"             TEXT NOT NULL,
  "dataOcorrencia"        TIMESTAMP(3) NOT NULL,
  "dadosAfetados"         TEXT,
  "titularesAfetados"     TEXT,
  "medidasTomadas"        TEXT,
  "comunicadoAnpdEm"      TIMESTAMP(3),
  "notificadoTitularesEm" TIMESTAMP(3),
  "emailsEnviados"        INTEGER NOT NULL DEFAULT 0,
  "emailsFalhados"        INTEGER NOT NULL DEFAULT 0,
  "registradoPorId"       INTEGER,
  "registradoPor"         TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
