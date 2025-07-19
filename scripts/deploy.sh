#!/bin/bash

# ==========================================
# STRIKING CONSULT - SCRIPT DE DEPLOY
# ==========================================

set -e

echo "🚀 Iniciando deploy da aplicação Striking Consult..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado!"
    print_message "Copiando .env.example para .env..."
    cp .env.example .env
    print_warning "⚠️  IMPORTANTE: Configure as variáveis no arquivo .env antes de continuar!"
    print_message "Pressione ENTER após configurar o .env ou Ctrl+C para cancelar..."
    read
fi

# Verificar se as variáveis obrigatórias estão definidas
print_step "Verificando configurações..."

source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "https://seu-projeto.supabase.co" ]; then
    print_error "VITE_SUPABASE_URL não está configurada corretamente no .env"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "sua-chave-publica-aqui" ]; then
    print_error "VITE_SUPABASE_ANON_KEY não está configurada corretamente no .env"
    exit 1
fi

print_message "✅ Configurações verificadas com sucesso!"

# Parar containers existentes
print_step "Parando containers existentes..."
docker-compose down

# Remover imagens antigas (opcional)
if [ "$1" = "--clean" ]; then
    print_step "Removendo imagens antigas..."
    docker image prune -f
    docker-compose build --no-cache
else
    print_step "Construindo nova imagem..."
    docker-compose build
fi

# Iniciar containers
print_step "Iniciando containers..."
docker-compose up -d

# Aguardar containers ficarem prontos
print_step "Aguardando containers ficarem prontos..."
sleep 10

# Verificar health check
print_step "Verificando saúde da aplicação..."
for i in {1..30}; do
    if curl -f http://localhost:${APP_PORT:-80}/health &> /dev/null; then
        print_message "✅ Aplicação está funcionando corretamente!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        print_error "❌ Aplicação não respondeu após 30 tentativas"
        docker-compose logs
        exit 1
    fi
    
    echo "Tentativa $i/30 - Aguardando aplicação ficar pronta..."
    sleep 2
done

# Mostrar status dos containers
print_step "Status dos containers:"
docker-compose ps

# Mostrar logs recentes
print_step "Últimos logs:"
docker-compose logs --tail=20

print_message "🎉 Deploy concluído com sucesso!"
print_message "📱 Aplicação disponível em: http://localhost:${APP_PORT:-80}"
print_message "📊 Health check: http://localhost:${APP_PORT:-80}/health"

echo ""
print_message "Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar aplicação: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
echo "  - Rebuild completa: ./scripts/deploy.sh --clean"