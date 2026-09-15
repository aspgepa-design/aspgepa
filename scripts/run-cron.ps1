# Runner de rotinas agendadas definidas em .agents/schedules/cron.yaml
# Uso: .\scripts\run-cron.ps1 <job-id>
param([string]$JobId)

$CronFile = ".agents/schedules/cron.yaml"

if (-not $JobId) {
  Write-Host "Uso: .\scripts\run-cron.ps1 <job-id>"
  Write-Host "Jobs disponiveis:"
  Select-String -Path $CronFile -Pattern '^\s+- id:' |
    ForEach-Object { "  " + ($_.Line -replace '.*id:\s*', '') }
  exit 1
}

$content = Get-Content $CronFile -Raw

if ($content -match "(?s)id:\s*$JobId.*?task_file:\s*""?([^""\r\n]+)""?") {
  $TaskFile = $Matches[1].Trim()
} else {
  Write-Host "[ERRO] Job '$JobId' nao encontrado em $CronFile"
  exit 1
}

$AgentFile = ""
if ($content -match "(?s)id:\s*$JobId.*?assigned_agent:\s*""?([^""\r\n]+)""?") {
  $AgentFile = $Matches[1].Trim()
}

Write-Host "[run] Executando job: $JobId"
Write-Host "  Tarefa:  $TaskFile"
Write-Host "  Agente:  $AgentFile"
Write-Host ""
Write-Host "Instrucoes da rotina:"
Get-Content $TaskFile
