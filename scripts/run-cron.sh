#!/usr/bin/env bash
# Runner de rotinas agendadas definidas em .agents/schedules/cron.yaml
# Uso: ./scripts/run-cron.sh <job-id>
set -e

JOB_ID="$1"
CRON_FILE=".agents/schedules/cron.yaml"

if [ -z "$JOB_ID" ]; then
  echo "Uso: $0 <job-id>"
  echo "Jobs disponíveis:"
  grep -E '^\s+- id:' "$CRON_FILE" | sed 's/.*id: //'
  exit 1
fi

TASK_FILE=$(grep -A3 "id: $JOB_ID" "$CRON_FILE" | grep 'task_file:' | sed 's/.*task_file: *"\?\([^"]*\)"\?/\1/')
AGENT_FILE=$(grep -A3 "id: $JOB_ID" "$CRON_FILE" | grep 'assigned_agent:' | sed 's/.*assigned_agent: *"\?\([^"]*\)"\?/\1/')

if [ -z "$TASK_FILE" ]; then
  echo "❌ Job '$JOB_ID' não encontrado em $CRON_FILE"
  exit 1
fi

echo "▶ Executando job: $JOB_ID"
echo "  Tarefa:  $TASK_FILE"
echo "  Agente:  $AGENT_FILE"
echo ""
echo "Instruções da rotina:"
cat "$TASK_FILE"
