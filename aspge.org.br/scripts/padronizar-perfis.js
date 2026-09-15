const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function padronizarPerfis() {
  console.log('Padronizando perfis...');
  
  // Atualizar todos os perfis para minúsculas
  const associados = await prisma.associado.findMany({
    where: {
      perfil: {
        notIn: ['presidente', 'diretor', 'tesoureiro', 'associado']
      }
    }
  });
  
  console.log(`Encontrados ${associados.length} associados com perfil não padronizado`);
  
  for (const associado of associados) {
    const perfilNovo = associado.perfil.toLowerCase().trim();
    console.log(`Atualizando ${associado.nomeCompleto}: ${associado.perfil} -> ${perfilNovo}`);
    
    await prisma.associado.update({
      where: { id: associado.id },
      data: { perfil: perfilNovo }
    });
  }
  
  console.log('\nVerificando resultado...');
  const porPerfil = await prisma.associado.groupBy({
    by: ['perfil'],
    _count: true
  });
  
  console.log('\nAssociados por perfil (após padronização):');
  porPerfil.forEach(p => {
    console.log(`${p.perfil}: ${p._count}`);
  });
  
  await prisma.$disconnect();
}

padronizarPerfis().catch(console.error);
