#!/bin/bash

# ==========================================
# STRIKING CONSULT - SCRIPT DE BACKUP
# ==========================================

set -e

BACKUP_DIR="./backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="striking-consult-backup-$DATE"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Função para fazer backup
do_backup() {
    print_step "Iniciando backup da aplicação..."
    
    # Criar diretório de backup se não existir
    mkdir -p $BACKUP_DIR
    
    # Backup dos arquivos de configuração
    print_message "Fazendo backup das configurações..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME-config.tar.gz" \
        .env \
        docker-compose.yml \
        nginx.conf \
        nginx/ \
        scripts/ \
        2>/dev/null || true
    
    # Backup dos volumes do Docker
    print_message "Fazendo backup dos volumes Docker..."
    docker-compose exec -T app tar -czf - /usr/share/nginx/html > "$BACKUP_DIR/$BACKUP_NAME-app.tar.gz" 2>/dev/null || true
    
    # Backup dos logs
    print_message "Fazendo backup dos logs..."
    if [ -d "logs" ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME-logs.tar.gz" logs/ 2>/dev/null || true
    fi
    
    print_message "✅ Backup concluído: $BACKUP_DIR/$BACKUP_NAME-*"
}

# Função para restaurar backup
restore_backup() {
    if [ -z "$1" ]; then
        echo "Uso: $0 --restore NOME_DO_BACKUP"
        echo "Backups disponíveis:"
        ls -la $BACKUP_DIR/ | grep -E "\.tar\.gz$" || echo "Nenhum backup encontrado"
        exit 1
    fi
    
    RESTORE_NAME="$1"
    
    print_warning "⚠️  ATENÇÃO: Isso irá sobrescrever os arquivos atuais!"
    read -p "Deseja continuar? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restauração cancelada."
        exit 0
    fi
    
    print_step "Restaurando backup: $RESTORE_NAME"
    
    # Parar containers
    docker-compose down
    
    # Restaurar configurações
    if [ -f "$BACKUP_DIR/$RESTORE_NAME-config.tar.gz" ]; then
        print_message "Restaurando configurações..."
        tar -xzf "$BACKUP_DIR/$RESTORE_NAME-config.tar.gz"
    fi
    
    # Restaurar aplicação
    if [ -f "$BACKUP_DIR/$RESTORE_NAME-app.tar.gz" ]; then
        print_message "Restaurando aplicação..."
        # Rebuildar container com backup
        docker-compose build
    fi
    
    # Reiniciar containers
    print_message "Reiniciando aplicação..."
    docker-compose up -d
    
    print_message "✅ Restauração concluída!"
}

# Função para configurar backup automático
setup_auto_backup() {
    print_step "Configurando backup automático..."
    
    # Criar script de backup automático
    cat > /tmp/auto-backup.sh << 'EOF'
#!/bin/bash
cd /caminho/para/sua/aplicacao
./scripts/backup.sh --auto
EOF
    
    # Adicionar ao crontab (executar diariamente às 2h)
    (crontab -l 2>/dev/null; echo "0 2 * * * /tmp/auto-backup.sh >> /var/log/striking-backup.log 2>&1") | crontab -
    
    print_message "✅ Backup automático configurado para executar diariamente às 2h"
    print_warning "Edite o caminho em /tmp/auto-backup.sh para o diretório correto da aplicação"
}

# Função para limpeza de backups antigos
cleanup_old_backups() {
    KEEP_DAYS=${1:-7}
    
    print_step "Removendo backups com mais de $KEEP_DAYS dias..."
    
    find $BACKUP_DIR -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
    
    print_message "✅ Limpeza concluída"
}

# Menu principal
case "$1" in
    --auto)
        print_message "Executando backup automático..."
        do_backup
        cleanup_old_backups 7
        ;;
    --restore)
        restore_backup "$2"
        ;;
    --setup)
        setup_auto_backup
        ;;
    --cleanup)
        cleanup_old_backups "$2"
        ;;
    *)
        echo "Uso: $0 [opção]"
        echo ""
        echo "Opções:"
        echo "  (sem opção)    - Fazer backup manual"
        echo "  --auto         - Backup automático (usado pelo cron)"
        echo "  --restore NAME - Restaurar backup específico"
        echo "  --setup        - Configurar backup automático"
        echo "  --cleanup DAYS - Remover backups antigos (padrão: 7 dias)"
        echo ""
        echo "Exemplos:"
        echo "  $0                                    # Backup manual"
        echo "  $0 --restore striking-consult-backup-20240101_120000"
        echo "  $0 --cleanup 30                      # Manter apenas 30 dias"
        exit 1
        ;;
esac

if [ "$1" = "" ]; then
    do_backup
fi