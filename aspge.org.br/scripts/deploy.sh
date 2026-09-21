#!/bin/bash

# Script de PROVISIONAMENTO do VPS Ubuntu para a ASPGE-PA
# Instala dependências, PostgreSQL, Nginx e firewall.
# Para deploy do código, use git pull + npm install + prisma migrate deploy + pm2 reload.
# Uso: ./scripts/deploy.sh

set -e

echo "========================================"
echo "Deploy ASPGE-PA API"
echo "========================================"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
APP_DIR="/var/www/aspge/app"
APP_NAME="aspge-api"
NODE_VERSION="18"
SSH_PORT="22022"  # Porta SSH customizada do VPS (não é a 22!)

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root (use sudo)${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}1. Instalando dependências do sistema...${NC}"
apt-get update
apt-get install -y curl wget git nginx postgresql postgresql-contrib

echo ""
echo -e "${YELLOW}2. Instalando Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

echo ""
echo -e "${YELLOW}3. Instalando PM2...${NC}"
npm install -g pm2

echo ""
echo -e "${YELLOW}4. Configurando PostgreSQL...${NC}"
systemctl start postgresql
systemctl enable postgresql

# Verificar se banco existe
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw aspge; then
    echo "Criando banco de dados 'aspge'..."
    sudo -u postgres createdb aspge
fi

echo ""
echo -e "${YELLOW}5. Criando diretório da aplicação...${NC}"
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs
mkdir -p ${APP_DIR}/public/uploads/{fotos,documentos,carteirinhas,templates}

# Configurar permissões
chown -R www-data:www-data ${APP_DIR}/public/uploads
chmod -R 755 ${APP_DIR}/public/uploads

echo ""
echo -e "${YELLOW}6. Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/aspge << 'EOF'
server {
    listen 80;
    server_name _;  # Aceita qualquer nome

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/aspge/app/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        alias /var/www/aspge/app/public;
        expires 1d;
    }
}
EOF

# Remover default se existir
rm -f /etc/nginx/sites-enabled/default

# Ativar site
ln -sf /etc/nginx/sites-available/aspge /etc/nginx/sites-enabled/aspge

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo -e "${YELLOW}7. Configurando Firewall...${NC}"
# ATENÇÃO: o SSH do VPS roda na porta 22022, não na 22.
# Sem esta regra, habilitar o UFW trancaria o acesso remoto.
ufw allow ${SSH_PORT}/tcp comment 'SSH customizado'
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configuração do servidor concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Copie os arquivos do projeto para ${APP_DIR}"
echo "2. Configure o arquivo .env com as credenciais do banco"
echo "3. Execute: cd ${APP_DIR} && npm install"
echo "4. Execute: npx prisma migrate deploy"
echo "5. Execute: pm2 start server.js --name ${APP_NAME}"
echo ""
echo "Comandos úteis:"
echo "  pm2 status              - Ver status da aplicação"
echo "  pm2 logs ${APP_NAME}    - Ver logs"
echo "  pm2 restart ${APP_NAME} - Reiniciar aplicação"
echo ""
