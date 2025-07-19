-- Atualizar política RLS da tabela users para permitir que professores vejam dados básicos dos alunos
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Permitir que usuários vejam seus próprios dados
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Permitir que professores vejam dados básicos dos alunos
CREATE POLICY "Professors can view student data" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users professor_user 
    WHERE professor_user.id = auth.uid() 
    AND professor_user.role = 'professor'
  ) 
  AND role = 'student'
);