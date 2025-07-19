-- Verificar e corrigir a restrição de roles na tabela users
-- Primeiro, vamos remover a restrição atual que está causando problemas
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Agora vamos adicionar uma nova restrição que permite os valores corretos
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'professor'));