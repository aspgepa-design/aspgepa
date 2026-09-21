const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const total = await prisma.associado.count();
    const senhaNaoAlterada = await prisma.associado.count({ where: { senhaAlterada: false } });
    const cadastroCompleto = await prisma.associado.count({ where: { cadastroCompleto: true } });
    const cadastroIncompleto = await prisma.associado.count({ where: { cadastroCompleto: false } });
    
    console.log('=== ESTADO DO BANCO DE DADOS ===');
    console.log(`Total de associados: ${total}`);
    console.log(`Senha não alterada: ${senhaNaoAlterada}`);
    console.log(`Cadastro completo: ${cadastroCompleto}`);
    console.log(`Cadastro incompleto: ${cadastroIncompleto}`);
    
    // Verificar se campos de endereço existem
    const comCep = await prisma.associado.count({ where: { cep: { not: null } } });
    const comEndereco = await prisma.associado.count({ where: { endereco: { not: null } } });
    const comTipoResidencia = await prisma.associado.count({ where: { tipoResidencia: { not: null } } });
    
    console.log('');
    console.log('=== PREENCHIMENTO DOS NOVOS CAMPOS ===');
    console.log(`Com CEP: ${comCep}`);
    console.log(`Com Endereço: ${comEndereco}`);
    console.log(`Com Tipo de Residência: ${comTipoResidencia}`);
    
    // Verificar se senha está definida
    const semSenha = await prisma.associado.count({ where: { senha: null } });
    console.log(`Sem senha: ${semSenha}`);
    
    if (semSenha > 0) {
      console.log('⚠️  Associados sem senha definida!');
    }
    
    // Associados que precisam atualizar (senha não alterada OU cadastro incompleto)
    const precisamAtualizar = await prisma.associado.count({
      where: {
        OR: [
          { senhaAlterada: false },
          { cadastroCompleto: false }
        ]
      }
    });
    
    console.log('');
    console.log(`=== Associados que precisam atualizar: ${precisamAtualizar} ===`);
    
    // Mostrar 3 exemplos
    const exemplos = await prisma.associado.findMany({
      take: 3,
      select: { nomeCompleto: true, cadastroCompleto: true, senhaAlterada: true }
    });
    
    console.log('');
    console.log('=== Exemplos ===');
    exemplos.forEach(a => {
      console.log(`${a.nomeCompleto}: cadastroCompleto=${a.cadastroCompleto}, senhaAlterada=${a.senhaAlterada}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
