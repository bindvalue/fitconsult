-- Criar política usando a função existente get_current_user_role()
CREATE POLICY "Students can view professor basic data for messaging"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'professor' AND get_current_user_role() = 'student'
);