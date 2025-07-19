-- Remover políticas que dependem da coluna role
DROP POLICY IF EXISTS "Professors can update student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Professors can update student users" ON public.users;
DROP POLICY IF EXISTS "Professors can update student account status" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view professor basic data" ON public.users;
DROP POLICY IF EXISTS "Users access policy" ON public.users;

-- Criar enum user_role
CREATE TYPE public.user_role AS ENUM ('student', 'professor', 'admin');

-- Atualizar a tabela users para usar o enum
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Recriar as políticas que foram removidas
CREATE POLICY "Professors can update student profiles" 
ON public.student_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

CREATE POLICY "Professors can update student users" 
ON public.users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role = 'professor'
) AND role = 'student');

CREATE POLICY "Professors can update student account status" 
ON public.users 
FOR UPDATE 
USING ((get_current_user_role() = 'professor') AND (role = 'student'))
WITH CHECK ((get_current_user_role() = 'professor') AND (role = 'student'));

CREATE POLICY "Authenticated users can view professor basic data" 
ON public.users 
FOR SELECT 
USING (role = 'professor');

CREATE POLICY "Users access policy" 
ON public.users 
FOR SELECT 
USING ((auth.uid() = id) OR ((get_current_user_role() = 'professor') AND (role = 'student')));

-- Adicionar políticas para admin
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update professor status" 
ON public.users 
FOR UPDATE 
USING (get_current_user_role() = 'admin' AND role = 'professor')
WITH CHECK (get_current_user_role() = 'admin' AND role = 'professor');

CREATE POLICY "Admins can view professor profiles" 
ON public.professor_profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');