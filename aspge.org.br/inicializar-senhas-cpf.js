const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando inicialização de senhas com CPF...');
    
    // Buscar todos os associados
    const associados = await prisma.associado.findMany();
    
    console.log(`Encontrados ${associados.length} associados no total.`);
    
    let atualizados = 0;
    let erros = 0;
    
    for (const associado of associados) {
      try {
        const cpfLimpo = associado.cpf.replace(/\D/g, '');
        
        if (cpfLimpo.length !== 11) {
          console.log(`CPF inválido para ${associado.nomeCompleto}: ${associado.cpf}`);
          erros++;
          continue;
        }
        
        // Hash do CPF como senha inicial
        const senhaHash = await bcrypt.hash(cpfLimpo, 10);
        
        // Preparar dados de atualização
        const dadosAtualizacao = {
          senha: senhaHash
        };
        
        // Adicionar senhaAlterada se o campo existir no schema
        try {
          await prisma.associado.update({
            where: { id: associado.id },
            data: {
              ...dadosAtualizacao,
              senhaAlterada: false
            }
          });
        } catch (error) {
          // Se o campo senhaAlterada não existir, atualizar sem ele
          if (error.message.includes('senhaAlterada')) {
            await prisma.associado.update({
              where: { id: associado.id },
              data: dadosAtualizacao
            });
          } else {
            throw error;
          }
        }
        
        console.log(`✓ Senha inicializada para ${associado.nomeCompleto} (CPF: ${cpfLimpo})`);
        atualizados++;
      } catch (error) {
        console.error(`Erro ao inicializar senha para ${associado.nomeCompleto}:`, error.message);
        erros++;
      }
    }
    
    console.log('\n=== Resumo ===');
    console.log(`Total processados: ${associados.length}`);
    console.log(`Atualizados com sucesso: ${atualizados}`);
    console.log(`Erros: ${erros}`);
    
  } catch (error) {
    console.error('Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
