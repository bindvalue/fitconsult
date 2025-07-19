-- Criar política RLS para permitir que estudantes premium atualizem suas próprias consultas
CREATE POLICY "Premium students can update own consultations"
ON public.consultations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = consultations.student_id 
    AND sp.user_id = auth.uid() 
    AND has_premium_plan(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = consultations.student_id 
    AND sp.user_id = auth.uid() 
    AND has_premium_plan(auth.uid())
  )
);