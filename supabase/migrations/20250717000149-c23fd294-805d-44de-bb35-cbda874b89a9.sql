-- Limpar e consolidar políticas da tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Professors can view student data" ON public.users;

-- Criar uma única política consolidada que permite:
-- 1. Usuários verem seus próprios dados
-- 2. Professores verem dados de alunos
CREATE POLICY "Users access policy" 
ON public.users 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (get_current_user_role() = 'professor' AND role = 'student')
);