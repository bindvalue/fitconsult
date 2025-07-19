-- Allow professors to create and update subscriptions for students
CREATE POLICY "Professors can create student subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND role = 'professor'
  )
);

CREATE POLICY "Professors can update student subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND role = 'professor'
  )
);

CREATE POLICY "Professors can view student subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND role = 'professor'
  )
);