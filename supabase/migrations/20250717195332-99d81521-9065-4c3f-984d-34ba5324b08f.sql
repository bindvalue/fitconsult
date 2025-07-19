-- Criar política RLS para permitir que professores excluam seus próprios desafios personalizados
CREATE POLICY "Professors can delete own challenges" 
ON public.challenges 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.professor_profiles 
    WHERE professor_profiles.user_id = auth.uid() 
    AND professor_profiles.id = challenges.created_by
  )
  AND challenges.is_predefined = false
);