# Validacao de sintaxe a custo zero de tokens (ASPGE-PA)
# Uso: .\.agents\hooks\validate-syntax.ps1
$ErrorActionPreference = 'Continue'
$AppDir = "aspge.org.br"
$Fail = $false

Write-Host "[check] Validando sintaxe JS em $AppDir ..."

Get-ChildItem -Path $AppDir -Recurse -Filter *.js -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object {
    $output = node --check $_.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[ERRO] Sintaxe: $($_.FullName)"
      Write-Host ($output | Out-String)
      $script:Fail = $true
    }
  }

$PrismaCli = "$AppDir\node_modules\prisma\build\index.js"
if ((Test-Path "$AppDir\prisma\schema.prisma") -and (Test-Path $PrismaCli)) {
  Write-Host "[check] Validando schema Prisma..."
  Push-Location $AppDir
  try {
    node "node_modules\prisma\build\index.js" validate
    if ($LASTEXITCODE -ne 0) { $script:Fail = $true }
  } finally {
    Pop-Location
  }
} elseif (Test-Path "$AppDir\prisma\schema.prisma") {
  Write-Host "[AVISO] Prisma CLI nao instalado - validacao de schema pulada."
}

if ($Fail) {
  Write-Host "[ERRO] Falhas encontradas"
  exit 1
} else {
  Write-Host "[OK] Sintaxe OK"
  exit 0
}
