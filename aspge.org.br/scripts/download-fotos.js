#!/usr/bin/env node

/**
 * Script para importar fotos dos associados a partir das URLs do Google Drive
 * armazenadas no banco de dados (campos fotoUrl e fotoCarteirinhaUrl).
 * 
 * Funciona com URLs de thumbnail públicas como:
 *   https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
 *   https://lh3.googleusercontent.com/d/FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *   https://drive.google.com/file/d/FILE_ID/view
 * 
 * Uso:
 *   node scripts/download-fotos.js                 # baixa fotoUrl e fotoCarteirinhaUrl
 *   node scripts/download-fotos.js --campo fotoUrl # baixa apenas fotoUrl
 *   node scripts/download-fotos.js --dry-run       # simula sem baixar
 *   node scripts/download-fotos.js --force          # re-baixa mesmo se já existe
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'fotos');
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Garantir que diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ===== Argumentos CLI =====
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const campoIdx = args.indexOf('--campo');
const CAMPO_FILTRO = campoIdx !== -1 ? args[campoIdx + 1] : null; // 'fotoUrl' ou 'fotoCarteirinhaUrl'

// ===== Extrair file ID de diversas formas de URL do Google Drive =====
function extrairDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  
  // thumbnail?id=FILE_ID
  let m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  // /d/FILE_ID/ (file/d/ID/view, open?id=, uc?id=)
  m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  // lh3.googleusercontent.com/d/FILE_ID
  m = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  return null;
}

function isGoogleDriveUrl(url) {
  if (!url) return false;
  return url.includes('drive.google.com') || 
         url.includes('googleusercontent.com') ||
         url.includes('docs.google.com');
}

function isLocalUrl(url) {
  if (!url) return false;
  return url.startsWith('/uploads/') || url.startsWith('http://localhost') || url.includes('/uploads/fotos/');
}

// ===== Download com seguimento de redirects =====
function downloadUrl(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Muitos redirects'));
    
    const proto = url.startsWith('https') ? https : http;
    
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    }, (res) => {
      // Seguir redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        return downloadUrl(redirectUrl, destPath, maxRedirects - 1).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      
      // Verificar content-type
      const ct = res.headers['content-type'] || '';
      if (!ct.startsWith('image/')) {
        // Consumir resposta para liberar socket
        res.resume();
        return reject(new Error(`Não é imagem (${ct})`));
      }
      
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        // Verificar tamanho (se < 1KB provavelmente é erro/placeholder)
        const stat = fs.statSync(destPath);
        if (stat.size < 1024) {
          fs.unlinkSync(destPath);
          return reject(new Error(`Arquivo muito pequeno (${stat.size} bytes), provável erro`));
        }
        resolve({ size: stat.size });
      });
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ===== Construir URL de download otimizada a partir do file ID =====
function buildDownloadUrl(fileId, size) {
  // Usar thumbnail com tamanho grande para qualidade boa
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size || 800}`;
}

// ===== Delay para não sobrecarregar =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== Função principal =====
async function main() {
  console.log('==============================================');
  console.log(' Importar Fotos do Google Drive → Sistema Node');
  console.log('==============================================');
  if (DRY_RUN) console.log('  ⚡ MODO DRY-RUN (sem downloads)');
  if (FORCE) console.log('  ⚡ MODO FORCE (re-baixar existentes)');
  if (CAMPO_FILTRO) console.log(`  ⚡ Apenas campo: ${CAMPO_FILTRO}`);
  console.log('');

  // Buscar todos os associados
  const associados = await prisma.associado.findMany({
    select: {
      id: true,
      cpf: true,
      nomeCompleto: true,
      fotoUrl: true,
      fotoCarteirinhaUrl: true
    },
    orderBy: { nomeCompleto: 'asc' }
  });

  console.log(`Total de associados: ${associados.length}\n`);

  let baixados = 0, pulados = 0, erros = 0, jaLocal = 0, semFoto = 0;
  const resultados = [];

  for (let i = 0; i < associados.length; i++) {
    const a = associados[i];
    const cpfLimpo = (a.cpf || '').replace(/\D/g, '');
    if (!cpfLimpo) { semFoto++; continue; }

    const campos = [];
    if (!CAMPO_FILTRO || CAMPO_FILTRO === 'fotoUrl') campos.push({ campo: 'fotoUrl', url: a.fotoUrl, sufixo: '' });
    if (!CAMPO_FILTRO || CAMPO_FILTRO === 'fotoCarteirinhaUrl') campos.push({ campo: 'fotoCarteirinhaUrl', url: a.fotoCarteirinhaUrl, sufixo: '_cart' });

    for (const { campo, url, sufixo } of campos) {
      const label = `[${i + 1}/${associados.length}] ${a.nomeCompleto} (${campo})`;

      if (!url) {
        semFoto++;
        continue;
      }

      // Já é uma URL local?
      if (isLocalUrl(url)) {
        jaLocal++;
        continue;
      }

      // É URL do Google Drive?
      if (!isGoogleDriveUrl(url)) {
        console.log(`  ⚠️  ${label}: URL desconhecida, pulando: ${url.substring(0, 60)}...`);
        pulados++;
        continue;
      }

      const fileId = extrairDriveFileId(url);
      if (!fileId) {
        console.log(`  ⚠️  ${label}: Não conseguiu extrair fileId de: ${url.substring(0, 80)}`);
        erros++;
        continue;
      }

      const filename = `${cpfLimpo}${sufixo}.jpg`;
      const destPath = path.join(UPLOAD_DIR, filename);

      // Já existe no disco?
      if (fs.existsSync(destPath) && !FORCE) {
        // Já existe localmente — apenas atualizar URL no DB se necessário
        const localUrl = `${APP_URL}/uploads/fotos/${filename}`;
        if (url !== localUrl) {
          if (!DRY_RUN) {
            await prisma.associado.update({
              where: { id: a.id },
              data: { [campo]: localUrl }
            });
          }
          console.log(`  🔗 ${label}: Já no disco, atualizou URL no DB`);
        }
        jaLocal++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  🔍 ${label}: Baixaria ${fileId} → ${filename}`);
        baixados++;
        continue;
      }

      // Download
      const downloadUrl2 = buildDownloadUrl(fileId, 800);
      try {
        const result = await downloadUrl(downloadUrl2, destPath);
        const localUrl = `${APP_URL}/uploads/fotos/${filename}`;
        
        await prisma.associado.update({
          where: { id: a.id },
          data: { [campo]: localUrl }
        });

        const sizeKB = Math.round(result.size / 1024);
        console.log(`  ✅ ${label}: ${sizeKB}KB → ${filename}`);
        baixados++;
        resultados.push({ nome: a.nomeCompleto, campo, filename, size: result.size });
      } catch (err) {
        console.log(`  ❌ ${label}: ${err.message}`);
        erros++;
      }

      // Delay entre downloads (evitar rate limit)
      await sleep(500);
    }
  }

  console.log('\n==============================================');
  console.log(' Resumo');
  console.log('==============================================');
  console.log(`  ✅ Baixados:         ${baixados}`);
  console.log(`  🔗 Já locais:        ${jaLocal}`);
  console.log(`  ⚠️  Pulados:          ${pulados}`);
  console.log(`  📭 Sem foto:          ${semFoto}`);
  console.log(`  ❌ Erros:             ${erros}`);
  console.log(`  📁 Destino:           ${UPLOAD_DIR}`);
  console.log('==============================================\n');

  if (DRY_RUN) {
    console.log('💡 Para executar de verdade, rode sem --dry-run');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('\n❌ Erro fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
