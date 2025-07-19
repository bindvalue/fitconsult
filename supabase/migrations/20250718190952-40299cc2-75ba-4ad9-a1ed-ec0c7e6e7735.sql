-- Remover políticas de storage que dependem da coluna role
DROP POLICY IF EXISTS "Professors can view all progress photos storage" ON storage.objects;

-- Remover TODAS as políticas que dependem da coluna role
DROP POLICY IF EXISTS "Professors can view student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Professors can view anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Professors can view student activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Professors can update student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Professors can update student users" ON public.users;
DROP POLICY IF EXISTS "Users access policy" ON public.users;
DROP POLICY IF EXISTS "Professors can create student subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Professors can update student subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Professors can view student subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view professor basic data" ON public.users;
DROP POLICY IF EXISTS "Users can edit own messages within time limit" ON public.messages;
DROP POLICY IF EXISTS "Professors can view all progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Professors can update progress photos comments" ON public.progress_photos;
DROP POLICY IF EXISTS "Users with active plan can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users with active plan can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Professors can update student account status" ON public.users;

-- Criar enum user_role
CREATE TYPE public.user_role AS ENUM ('student', 'professor', 'admin');

-- Atualizar a tabela users para usar o enum
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;