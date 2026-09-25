/**
 * Testes E2E de fumaça — Puppeteer + Jest.
 *
 * Sobe a app em uma porta aleatória com o Prisma mockado e navega
 * pelas páginas públicas, validando renderização e o wizard da inscrição.
 *
 * Rodar:  npm run test:e2e
 */
jest.mock('../src/config/database');

const puppeteer = require('puppeteer');

let server;
let baseUrl;
let browser;

beforeAll(async () => {
  const app = require('../server');
  await new Promise(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}, 90000);

afterAll(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(r => server.close(r));
});

async function abrir(caminho) {
  const page = await browser.newPage();
  const resp = await page.goto(baseUrl + caminho, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  return { page, status: resp.status() };
}

describe('E2E — páginas públicas', () => {
  test('GET /health responde 200', async () => {
    const { status } = await abrir('/health');
    expect(status).toBe(200);
  });

  test('home carrega com título da associação', async () => {
    const { page, status } = await abrir('/');
    expect(status).toBe(200);
    const title = await page.title();
    expect(title).toMatch(/ASPGE-PA/);
  });

  test('login renderiza formulário de CPF e senha', async () => {
    const { page, status } = await abrir('/login');
    expect(status).toBe(200);
    expect(await page.$('input[type="password"], input[name="senha"], #senha')).toBeTruthy();
  });

  test('inscrição renderiza wizard com botão Próximo', async () => {
    const { page, status } = await abrir('/inscricao');
    expect(status).toBe(200);
    expect(await page.$('#btnProximo')).toBeTruthy();
    expect(await page.$('#cep')).toBeTruthy();
  });

  test('wizard bloqueia avanço com obrigatórios vazios e destaca o campo', async () => {
    const { page } = await abrir('/inscricao');
    await page.click('#btnProximo');
    await page.waitForSelector('.field-error', { timeout: 5000 });
    // Continua na etapa 1
    const etapaAtiva = await page.$eval('.step-item.active', el => el.dataset.step);
    expect(etapaAtiva).toBe('1');
    // Campo nome destacado com mensagem inline
    const erro = await page.$eval('.field-error', el => el.textContent);
    expect(erro).toMatch(/obrigat/i);
  });

  test('wizard avança quando a etapa está válida', async () => {
    const { page } = await abrir('/inscricao');
    await page.type('#nomeCompleto', 'Fulano de Tal');
    await page.type('#cpf', '52998224725');
    await page.type('#rg', '123456');
    await page.click('#btnProximo');
    await page.waitForFunction(
      () => document.querySelector('.step-item.active').dataset.step === '2',
      { timeout: 5000 }
    );
  });

  test('página de privacidade (LGPD) renderiza', async () => {
    const { page, status } = await abrir('/privacidade');
    expect(status).toBe(200);
    const conteudo = await page.content();
    expect(conteudo).toMatch(/LGPD|privacidade/i);
  });
});
