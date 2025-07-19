# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d5a633d0-a5ff-47c2-b0af-5bff910fbb0e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d5a633d0-a5ff-47c2-b0af-5bff910fbb0e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d5a633d0-a5ff-47c2-b0af-5bff910fbb0e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deploy outside Lovable

Para implementar este projeto fora do ambiente Lovable, siga estas etapas:

### 1. Configuração do Supabase

Primeiro, você precisa configurar seu próprio projeto Supabase:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Execute os scripts SQL localizados em `scripts/` para configurar o banco de dados
4. Configure as variáveis de ambiente

### 2. Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Atualização do Cliente Supabase

No arquivo `src/integrations/supabase/client.ts`, descomente as linhas para usar variáveis de ambiente:

```typescript
// Descomente estas linhas para uso em ambientes externos:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// E comente as linhas hardcoded:
// const SUPABASE_URL = "SUPABASE_URL";
// const SUPABASE_PUBLISHABLE_KEY = "SUPABASE_PUBLISHABLE_KEY";
```

### 4. Deploy

Para deploy em produção, você pode usar serviços como:

- **Vercel**: `npm i -g vercel && vercel`
- **Netlify**: `npm run build` e faça upload da pasta `dist`
- **Docker**: Use os arquivos `Dockerfile` e `docker-compose.yml` incluídos

Para mais detalhes sobre deploy com Docker, consulte o arquivo `README-DEPLOY.md`.
