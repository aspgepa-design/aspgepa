-- Carteirinha física: registra a última emissão (export de PDF p/ impressão)
ALTER TABLE "associados" ADD COLUMN "carteirinhaEmitidaEm" TIMESTAMP(3);
