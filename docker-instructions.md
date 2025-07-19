# Docker Instructions

## Build da Imagem
```bash
docker build -t fitness-app .
```

## Executar Container
```bash
docker run -p 3000:80 fitness-app
```

## Executar em Background
```bash
docker run -d -p 3000:80 --name fitness-app-container fitness-app
```

## Comandos Úteis
```bash
# Ver logs
docker logs fitness-app-container

# Parar container
docker stop fitness-app-container

# Remover container
docker rm fitness-app-container

# Remover imagem
docker rmi fitness-app
```

## Produção
Para produção, use um processo de CI/CD ou faça deploy direto:
```bash
# Build para produção
docker build -t meu-servidor.com/fitness-app:latest .

# Push para registry (opcional)
docker push meu-servidor.com/fitness-app:latest
```

A aplicação estará disponível em `http://localhost:3000`