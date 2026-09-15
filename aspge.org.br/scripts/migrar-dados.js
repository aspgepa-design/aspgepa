#!/usr/bin/env node

/**
 * Script de migração de Google Sheets para PostgreSQL
 * 
 * Instruções:
 * 1. Exporte cada aba do Google Sheets como CSV
 * 2. Salve os arquivos na pasta /scripts/csv/
 * 3. Configure o DATABASE_URL no .env
 * 4. Execute: node scripts/migrar-dados.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Configurações
const CSV_DIR = path.join(__dirname, 'csv');

// Mapeamento de colunas do CSV para o banco
const MAPEAMENTO_ASSOCIADOS = {
  'Nome Completo': 'nomeCompleto',
  'CPF': 'cpf',
  'RG': 'rg',
  'Expeditor': 'expeditor',
  'Matrícula': 'matricula',
  'Cargo': 'cargo',
  'Perfil': 'perfil',
  'Situação': 'situacao',
  'Sexo': 'sexo',
  'WhatsApp': 'whatsapp',
  'Email': 'email',
  'Data Nascimento': 'dataNascimento',
  'Naturalidade': 'naturalidade',
  'Estado Civil': 'estadoCivil',
  'Graduação': 'graduacao',
  'Pós-Graduação': 'posGraduacao',
  'Área Atuação': 'areaAtuacao',
  'Lotação': 'lotacao',
  'Foto URL': 'fotoUrl',
  'Foto Carteirinha URL': 'fotoCarteirinhaUrl'
};

async function migrarAssociados() {
  console.log('Migrando associados...');
  
  const filePath = path.join(CSV_DIR, 'associados.csv');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  associados.csv não encontrado, pulando...');
    return;
  }
  
  const file = fs.readFileSync(filePath, 'utf8');
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  let count = 0;
  
  for (const record of records) {
    try {
      const dados = {};
      
      // Mapear campos
      for (const [csvCol, dbCol] of Object.entries(MAPEAMENTO_ASSOCIADOS)) {
        if (record[csvCol] !== undefined && record[csvCol] !== '') {
          dados[dbCol] = record[csvCol];
        }
      }
      
      // Limpar CPF
      if (dados.cpf) {
        dados.cpf = dados.cpf.replace(/\D/g, '');
      }
      
      // Verificar se já existe
      const existente = await prisma.associado.findUnique({
        where: { cpf: dados.cpf }
      });
      
      if (existente) {
        // Atualizar
        await prisma.associado.update({
          where: { id: existente.id },
          data: dados
        });
        console.log(`  ✏️  Atualizado: ${dados.nomeCompleto}`);
      } else {
        // Criar
        // Definir senha temporária padrão (CPF)
        dados.senha = await require('bcrypt').hash(dados.cpf, 10);
        
        await prisma.associado.create({ data: dados });
        console.log(`  ✓ Criado: ${dados.nomeCompleto}`);
        count++;
      }
    } catch (error) {
      console.error(`  ✗ Erro em ${record['Nome Completo']}:`, error.message);
    }
  }
  
  console.log(`✓ Associados migrados: ${count}`);
}

async function migrarEventos() {
  console.log('\nMigrando eventos...');
  
  const filePath = path.join(CSV_DIR, 'eventos.csv');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  eventos.csv não encontrado, pulando...');
    return;
  }
  
  const file = fs.readFileSync(filePath, 'utf8');
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  // Limpar eventos existentes
  await prisma.evento.deleteMany({});
  
  for (const record of records) {
    try {
      // Converter data dd/MM/yyyy
      const dataParts = record['Data']?.split('/');
      let data = null;
      if (dataParts && dataParts.length === 3) {
        data = new Date(parseInt(dataParts[2]), parseInt(dataParts[1]) - 1, parseInt(dataParts[0]));
      }
      
      await prisma.evento.create({
        data: {
          data: data || new Date(),
          titulo: record['Título'] || 'Sem título',
          local: record['Local'] || null,
          horario: record['Horário'] || null,
          descricao: record['Descrição'] || null,
          visivel: record['Visível']?.toUpperCase() !== 'FALSE'
        }
      });
    } catch (error) {
      console.error(`  ✗ Erro no evento ${record['Título']}:`, error.message);
    }
  }
  
  console.log(`✓ Eventos migrados: ${records.length}`);
}

async function migrarConvenios() {
  console.log('\nMigrando convênios...');
  
  const filePath = path.join(CSV_DIR, 'convenios.csv');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  convenios.csv não encontrado, pulando...');
    return;
  }
  
  const file = fs.readFileSync(filePath, 'utf8');
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  await prisma.convenio.deleteMany({});
  
  for (const record of records) {
    try {
      await prisma.convenio.create({
        data: {
          nome: record['Nome'] || 'Sem nome',
          descricao: record['Descrição'] || null,
          categoria: record['Categoria'] || null,
          link: record['Link'] || '#',
          visivel: record['Visível']?.toUpperCase() !== 'FALSE'
        }
      });
    } catch (error) {
      console.error(`  ✗ Erro no convênio ${record['Nome']}:`, error.message);
    }
  }
  
  console.log(`✓ Convênios migrados: ${records.length}`);
}

async function main() {
  console.log('========================================');
  console.log('Migração de dados - Google Sheets → PostgreSQL');
  console.log('========================================\n');
  
  // Verificar se diretório CSV existe
  if (!fs.existsSync(CSV_DIR)) {
    console.error('❌ Diretório CSV não encontrado:');
    console.error('   Crie a pasta scripts/csv/ e coloque os arquivos CSV exportados do Google Sheets');
    process.exit(1);
  }
  
  try {
    await migrarAssociados();
    await migrarEventos();
    await migrarConvenios();
    
    console.log('\n========================================');
    console.log('✅ Migração concluída com sucesso!');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
