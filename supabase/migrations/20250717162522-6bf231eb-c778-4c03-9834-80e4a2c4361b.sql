-- Remover a política problemática
DROP POLICY IF EXISTS "Students can view professor basic data for messaging" ON public.users;

-- Criar função mais simples que não causa recursão
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'app_metadata' ->> 'role'),
    'student'
  );
$$;

-- Criar política usando a função que não causa recursão
CREATE POLICY "Students can view professor basic data for messaging"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'professor' AND auth_user_role() = 'student'
);