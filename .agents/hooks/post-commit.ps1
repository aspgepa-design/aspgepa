# Hook pos-commit (PowerShell): regenera public/versoes.json a partir do git log.
# Uso manual: .\.agents\hooks\post-commit.ps1
$ErrorActionPreference = 'Continue'

$root = git rev-parse --show-toplevel
Push-Location "$root\aspge.org.br"
try {
  node scripts/gerar-versoes.js
  if ($LASTEXITCODE -eq 0) {
    git add aspge.org.br/public/versoes.json 2>$null
  } else {
    Write-Host "[AVISO] Falha ao gerar versoes.json (nao bloqueia o commit)"
  }
} finally {
  Pop-Location
}
