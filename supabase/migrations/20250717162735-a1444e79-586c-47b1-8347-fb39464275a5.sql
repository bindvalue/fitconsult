-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Students can view professor basic data for messaging" ON public.users;
DROP FUNCTION IF EXISTS public.is_student_user();

-- Criar uma política mais simples que permite que usuários autenticados vejam dados básicos de professores
CREATE POLICY "Authenticated users can view professor basic data"
ON public.users
FOR SELECT
TO authenticated
USING (role = 'professor');