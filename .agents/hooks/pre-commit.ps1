# Hook pre-commit (PowerShell): bloqueia segredos e valida sintaxe (custo zero de tokens)
# Uso: .\.agents\hooks\pre-commit.ps1
$ErrorActionPreference = 'Continue'

Write-Host "[check] Verificando segredos e arquivos proibidos no stage..."

$staged = git diff --cached --name-only

# Bloqueia .env e dumps com dados pessoais (migration.sql do Prisma é permitido)
$forbidden = $staged | Where-Object { $_ -match '(^|/)\.env$|\.dump$|\.sql$' -and $_ -notmatch 'prisma/migrations/.*\.sql$' }
if ($forbidden) {
  Write-Host "[ERRO] Arquivo proibido no commit (.env/dump):"
  $forbidden | ForEach-Object { Write-Host "   $_" }
  exit 1
}

# Bloqueia edicoes no piloto GAS
$gasFiles = $staged | Where-Object { $_ -match '^GAS/' }
if ($gasFiles) {
  Write-Host "[ERRO] Alteracoes em GAS/ sao proibidas (piloto somente leitura):"
  $gasFiles | ForEach-Object { Write-Host "   $_" }
  exit 1
}

# Segredos hardcoded comuns
$secrets = git diff --cached -U0 |
  Where-Object { $_ -match 'jwt_secret|password|senha|BEGIN (RSA|OPENSSH) PRIVATE KEY' -and $_ -notmatch '\.env\.example' }
if ($secrets) {
  Write-Host "[AVISO] Possivel segredo no diff - revise antes de commitar."
}

& "$PSScriptRoot\validate-syntax.ps1"
exit $LASTEXITCODE
