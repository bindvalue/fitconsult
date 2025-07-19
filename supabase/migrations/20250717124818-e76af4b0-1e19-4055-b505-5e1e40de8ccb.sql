-- Permitir que professores editem dados de alunos
CREATE POLICY "Professors can update student profiles" 
ON public.student_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Permitir que professores editem dados básicos de usuários estudantes
CREATE POLICY "Professors can update student users" 
ON public.users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role = 'professor'
) AND role = 'student');