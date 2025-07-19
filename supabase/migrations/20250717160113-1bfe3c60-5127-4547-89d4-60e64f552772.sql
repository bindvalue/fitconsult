-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Students can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Students can create own subscriptions" ON public.subscriptions;

-- Criar nova política mais direta para estudantes visualizarem suas próprias subscriptions
CREATE POLICY "Students can view own subscriptions v2" 
ON public.subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.student_profiles sp
    WHERE sp.id = subscriptions.student_id 
    AND sp.user_id = auth.uid()
  )
);

-- Criar política para estudantes criarem suas próprias subscriptions
CREATE POLICY "Students can create own subscriptions v2" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.student_profiles sp
    WHERE sp.id = subscriptions.student_id 
    AND sp.user_id = auth.uid()
  )
);