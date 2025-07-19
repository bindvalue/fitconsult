-- Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Students can view professor basic data for messaging" ON public.users;

-- Criar função security definer para verificar se usuário é estudante
CREATE OR REPLACE FUNCTION public.is_student_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
  ) AND (
    SELECT role FROM public.users 
    WHERE id = auth.uid()
  ) = 'student';
$$;

-- Criar nova política sem recursão usando a função
CREATE POLICY "Students can view professor basic data for messaging"
ON public.users
FOR SELECT
TO authenticated
USING (
  (role = 'professor' AND is_student_user())
);