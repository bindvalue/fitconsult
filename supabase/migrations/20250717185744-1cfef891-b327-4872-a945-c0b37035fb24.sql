-- Corrigir políticas RLS para a tabela consultations
-- Remover políticas antigas
DROP POLICY IF EXISTS "Premium students can create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Premium students can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Professors can manage consultations" ON public.consultations;
DROP POLICY IF EXISTS "Professors can view own consultations" ON public.consultations;

-- Criar políticas corretas que fazem join com as tabelas de perfil
CREATE POLICY "Premium students can create consultations" 
ON public.consultations 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.student_profiles sp
    WHERE sp.id = consultations.student_id
    AND sp.user_id = auth.uid()
    AND has_premium_plan(auth.uid())
  )
);

CREATE POLICY "Premium students can view own consultations" 
ON public.consultations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.student_profiles sp
    WHERE sp.id = consultations.student_id
    AND sp.user_id = auth.uid()
    AND has_premium_plan(auth.uid())
  )
);

CREATE POLICY "Professors can manage consultations" 
ON public.consultations 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.professor_profiles pp
    WHERE pp.id = consultations.professor_id
    AND pp.user_id = auth.uid()
  )
);

CREATE POLICY "Professors can view own consultations" 
ON public.consultations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.professor_profiles pp
    WHERE pp.id = consultations.professor_id
    AND pp.user_id = auth.uid()
  )
);