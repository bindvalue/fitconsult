-- Criar política RLS para permitir que estudantes vejam dados básicos de professores
CREATE POLICY "Students can view professor basic data for messaging"
ON public.users
FOR SELECT
TO authenticated
USING (
  (role = 'professor' AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'student'
  ))
);