-- Corrigir recursão infinita na política RLS da tabela users
DROP POLICY IF EXISTS "Professors can view student data" ON public.users;

-- Recriar a política usando a função security definer existente para evitar recursão
CREATE POLICY "Professors can view student data" 
ON public.users 
FOR SELECT 
USING (
  (get_current_user_role() = 'professor' AND role = 'student')
  OR 
  (auth.uid() = id)
);