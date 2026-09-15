const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.associado.findFirst({ where: { nomeCompleto: { contains: 'LEON JAMES' } } })
  .then(r => { console.log(r.nomeCompleto, '|', r.perfil, '|', r.cpf); p.$disconnect(); });
