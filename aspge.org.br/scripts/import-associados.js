const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const csv = require('csv-parse');

const prisma = new PrismaClient();

// Mapeamento de perfis do CSV para o sistema
function mapearPerfil(perfilCsv) {
  const perfil = perfilCsv.toLowerCase().trim();
  if (perfil.includes('presidente')) return 'presidente';
  if (perfil.includes('vice-presidente')) return 'presidente'; // Tratar como presidente por enquanto
  if (perfil.includes('diretor')) return 'diretor';
  if (perfil.includes('tesoureiro')) return 'tesoureiro';
  if (perfil.includes('conselho fiscal')) return 'tesoureiro'; // Conselho fiscal tem acesso financeiro
  if (perfil.includes('secretário') || perfil.includes('secretaria')) return 'diretor';
  return 'associado'; // Membro padrão
}

// Limpar CPF (remover pontos e traços)
function limparCPF(cpf) {
  if (!cpf) return null;
  return cpf.replace(/\D/g, '');
}

// Limpar telefone
function limparTelefone(telefone) {
  if (!telefone || telefone === 'NÃO' || telefone === 'Não') return null;
  return telefone.replace(/\D/g, '');
}

async function importarAssociados() {
  const csvPath = 'd:\\Users\\leon.james\\Downloads\\ASPGE - Associados - Cópia de Associados.csv';
  
  console.log('Lendo arquivo CSV...');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const associados = [];
  let sucesso = 0;
  let erro = 0;
  
  await new Promise((resolve, reject) => {
    const parser = csv.parse(fileContent, {
      columns: true,
      delimiter: ',',
      skip_empty_lines: true
    });
    
    parser.on('data', (row) => {
      associados.push(row);
    });
    
    parser.on('end', resolve);
    parser.on('error', reject);
  });
  
  console.log(`Encontrados ${associados.length} associados no CSV.`);
  
  for (const row of associados) {
    try {
      const cpfLimpo = limparCPF(row['CPF']);
      
      if (!cpfLimpo || cpfLimpo.length !== 11) {
        console.log(`⚠️  CPF inválido: ${row['Nome do Associado']} - ${row['CPF']}`);
        erro++;
        continue;
      }
      
      // Verificar se já existe
      const existente = await prisma.associado.findFirst({
        where: { cpf: cpfLimpo }
      });
      
      if (existente) {
        console.log(`⏭️  Já existe: ${row['Nome do Associado']}`);
        continue;
      }
      
      // Gerar senha hashada (CPF como senha)
      const senhaHash = await bcrypt.hash(cpfLimpo, 10);
      
      // Mapear perfil
      const perfil = mapearPerfil(row['Perfil']);
      
      // Determinar situação
      const status = row['Status']?.toLowerCase().trim();
      const situacao = status === 'ativo' ? 'Ativo' : status === 'inativo' ? 'Inativo' : 'Ativo';
      
      await prisma.associado.create({
        data: {
          nomeCompleto: row['Nome do Associado']?.trim(),
          cpf: cpfLimpo,
          rg: row['RG']?.trim() || null,
          expeditor: row['Expeditor']?.trim() || null,
          matricula: row['Matricula Funcional']?.trim() || null,
          cargo: row['Cargo']?.trim() || null,
          whatsapp: limparTelefone(row['WhatsApp']),
          email: row['Email']?.trim() || null,
          perfil: perfil,
          situacao: situacao,
          senha: senhaHash,
          fotoUrl: row['Foto']?.trim() || null
        }
      });
      
      console.log(`✅ Importado: ${row['Nome do Associado']} - ${perfil}`);
      sucesso++;
      
    } catch (error) {
      console.error(`❌ Erro ao importar ${row['Nome do Associado']}:`, error.message);
      erro++;
    }
  }
  
  console.log('\n===== RESUMO =====');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erro}`);
  console.log(`⏭️  Já existiam: ${associados.length - sucesso - erro}`);
  
  await prisma.$disconnect();
}

importarAssociados().catch(console.error);
