-- Corrigir a política RLS para workout_plans - visualização para estudantes
DROP POLICY IF EXISTS "Students can view own workout plans" ON workout_plans;

CREATE POLICY "Students can view own workout plans" 
ON workout_plans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = workout_plans.student_id 
    AND sp.user_id = auth.uid()
  )
);