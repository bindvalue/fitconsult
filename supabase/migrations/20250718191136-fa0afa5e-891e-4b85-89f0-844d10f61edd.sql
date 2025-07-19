-- Recriar todas as políticas RLS que foram removidas

-- Políticas para student_profiles
CREATE POLICY "Professors can view student profiles" 
ON public.student_profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

CREATE POLICY "Professors can update student profiles" 
ON public.student_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Políticas para anamnesis
CREATE POLICY "Professors can view anamnesis" 
ON public.anamnesis 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Políticas para activity_logs
CREATE POLICY "Professors can view student activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Políticas para users
CREATE POLICY "Professors can update student users" 
ON public.users 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.role = 'professor'
) AND role = 'student');

CREATE POLICY "Users access policy" 
ON public.users 
FOR SELECT 
USING ((auth.uid() = id) OR ((get_current_user_role() = 'professor') AND (role = 'student')));

CREATE POLICY "Authenticated users can view professor basic data" 
ON public.users 
FOR SELECT 
USING (role = 'professor');

CREATE POLICY "Professors can update student account status" 
ON public.users 
FOR UPDATE 
USING ((get_current_user_role() = 'professor') AND (role = 'student'))
WITH CHECK ((get_current_user_role() = 'professor') AND (role = 'student'));

-- Políticas para subscriptions
CREATE POLICY "Professors can create student subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

CREATE POLICY "Professors can update student subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

CREATE POLICY "Professors can view student subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Políticas para messages
CREATE POLICY "Users can edit own messages within time limit" 
ON public.messages 
FOR UPDATE 
USING ((auth.uid() = sender_id) AND (has_active_plan(auth.uid()) OR (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
))) AND (sent_at > (now() - '00:05:00'::interval)))
WITH CHECK ((auth.uid() = sender_id) AND (has_active_plan(auth.uid()) OR (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
))));

CREATE POLICY "Users with active plan can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK ((auth.uid() = sender_id) AND (has_active_plan(auth.uid()) OR (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
))) AND is_account_active(auth.uid()));

CREATE POLICY "Users with active plan can view own messages" 
ON public.messages 
FOR SELECT 
USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)) AND (has_active_plan(auth.uid()) OR (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
))) AND is_account_active(auth.uid()));

-- Políticas para progress_photos
CREATE POLICY "Professors can view all progress photos" 
ON public.progress_photos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

CREATE POLICY "Professors can update progress photos comments" 
ON public.progress_photos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
));

-- Políticas para storage
CREATE POLICY "Professors can view all progress photos storage" 
ON storage.objects 
FOR SELECT 
USING ((bucket_id = 'progress-photos') AND (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'professor'
)));

-- Políticas para admin
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