const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarImportacao() {
  const total = await prisma.associado.count();
  console.log('Total de associados:', total);
  
  const porPerfil = await prisma.associado.groupBy({
    by: ['perfil'],
    _count: true
  });
  
  console.log('\nAssociados por perfil:');
  porPerfil.forEach(p => {
    console.log(`${p.perfil}: ${p._count}`);
  });
  
  const porSituacao = await prisma.associado.groupBy({
    by: ['situacao'],
    _count: true
  });
  
  console.log('\nAssociados por situação:');
  porSituacao.forEach(p => {
    console.log(`${p.situacao}: ${p._count}`);
  });
  
  await prisma.$disconnect();
}

verificarImportacao().catch(console.error);
