# 🚀 Guia de Deploy - Striking Consult

Este guia completo te ajudará a hospedar a aplicação Striking Consult em seu próprio servidor.

## 📋 Pré-requisitos

- **Servidor**: VPS ou servidor dedicado com Ubuntu 20.04+ (recomendado)
- **Recursos mínimos**: 1 GB RAM, 1 CPU, 20 GB disco
- **Docker**: Versão 20.10+
- **Docker Compose**: Versão 1.29+
- **Domínio**: (Opcional) Para SSL e produção

## 🛠️ Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/striking-consult.git
cd striking-consult
```

### 2. Execute a configuração inicial
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Configure o arquivo .env
```bash
nano .env
```

Configure as variáveis obrigatórias:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
DOMAIN=seu-dominio.com
APP_PORT=80
```

### 4. Execute o deploy
```bash
./scripts/deploy.sh
```

## 📁 Estrutura de Arquivos

```
striking-consult/
├── docker-compose.yml      # Orquestração dos containers
├── Dockerfile             # Imagem da aplicação
├── nginx.conf            # Configuração do servidor web
├── .env.example          # Template de configuração
├── scripts/              # Scripts de automação
│   ├── setup.sh         # Configuração inicial
│   ├── deploy.sh        # Deploy da aplicação
│   ├── backup.sh        # Sistema de backup
│   └── ssl-setup.sh     # Configuração SSL
├── backup/              # Diretório de backups
├── logs/                # Logs da aplicação
└── ssl/                 # Certificados SSL
```

## 🔧 Configurações Detalhadas

### Variáveis de Ambiente (.env)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | ✅ |
| `DOMAIN` | Seu domínio principal | ❌ |
| `APP_PORT` | Porta da aplicação (padrão: 80) | ❌ |
| `NODE_ENV` | Ambiente (production) | ❌ |

### Configuração do Supabase

1. **No painel do Supabase**, vá em **Authentication → URL Configuration**
2. Configure:
   - **Site URL**: `https://seu-dominio.com`
   - **Redirect URLs**: 
     - `https://seu-dominio.com`
     - `https://seu-dominio.com/auth/callback`

## 🔒 Configuração SSL (HTTPS)

### SSL com Let's Encrypt (Recomendado)
```bash
./scripts/ssl-setup.sh seu-dominio.com
```

### SSL Manual
1. Coloque os certificados em `ssl/`
2. Configure o nginx para usar os certificados
3. Reinicie com: `docker-compose --profile ssl up -d`

## 💾 Sistema de Backup

### Backup Manual
```bash
./scripts/backup.sh
```

### Backup Automático
```bash
./scripts/backup.sh --setup
```

### Restaurar Backup
```bash
./scripts/backup.sh --restore nome-do-backup
```

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost/health
```

### Logs da Aplicação
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs app
```

### Status dos Containers
```bash
docker-compose ps
```

## 🔧 Comandos Úteis

### Gerenciamento da Aplicação
```bash
# Iniciar aplicação
docker-compose up -d

# Parar aplicação
docker-compose down

# Reiniciar aplicação
docker-compose restart

# Rebuild completa
docker-compose build --no-cache
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Manutenção
```bash
# Limpeza de imagens antigas
docker image prune -f

# Limpeza completa
docker system prune -a -f

# Atualizar aplicação
git pull
./scripts/deploy.sh --clean
```

## 🌐 Configurações de Rede

### Firewall (UFW)
```bash
# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir SSH
sudo ufw allow ssh

# Ativar firewall
sudo ufw enable
```

### Nginx Proxy (Para múltiplos sites)
```bash
# Usar perfil proxy
docker-compose --profile proxy up -d
```

## 🚨 Solução de Problemas

### Aplicação não inicia
1. Verifique os logs: `docker-compose logs`
2. Verifique o arquivo .env
3. Teste conectividade com Supabase

### Erro de DNS/SSL
1. Verifique se o domínio aponta para o servidor
2. Aguarde propagação DNS (até 48h)
3. Verifique logs do Nginx

### Performance baixa
1. Monitore recursos: `htop`
2. Verifique logs de erro
3. Considere aumentar recursos do servidor

### Backup/Restore
```bash
# Listar backups
ls -la backup/

# Backup de emergência
docker-compose exec app tar -czf - /usr/share/nginx/html > backup/emergency-$(date +%Y%m%d).tar.gz
```

## 📞 Suporte

### Logs Importantes
- **Aplicação**: `docker-compose logs app`
- **Nginx**: `docker-compose logs nginx-proxy`
- **Sistema**: `/var/log/syslog`
- **SSL**: `/var/log/letsencrypt-renew.log`

### Comandos de Diagnóstico
```bash
# Verificar portas
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Verificar DNS
dig seu-dominio.com

# Testar conectividade
curl -I http://localhost/health
curl -I https://seu-dominio.com/health
```

## 🔄 Atualizações

### Atualizar Aplicação
```bash
git pull
./scripts/deploy.sh
```

### Atualizar Docker
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade docker-ce docker-compose-plugin
```

## 📈 Otimizações de Produção

### Cache e Performance
- Configurar CDN (CloudFlare recomendado)
- Otimizar imagens
- Configurar cache do navegador

### Segurança
- Configurar fail2ban
- Atualizar sistema regularmente
- Monitorar logs de segurança

### Escalabilidade
- Load balancer com múltiplas instâncias
- Separar banco de dados
- Configurar cache Redis

---

## 🎯 Checklist de Deploy

- [ ] Servidor configurado com Docker
- [ ] Repositório clonado
- [ ] Arquivo .env configurado
- [ ] Variáveis do Supabase definidas
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando
- [ ] SSL configurado (se aplicável)
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] DNS apontando corretamente
- [ ] Firewall configurado

**🎉 Parabéns! Sua aplicação Striking Consult está rodando em produção!**