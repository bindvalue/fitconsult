-- Corrigir políticas RLS para workout_sessions

-- Remover políticas existentes
DROP POLICY IF EXISTS "Students can create own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Students can view own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Professors can view student workout sessions" ON workout_sessions;

-- Criar políticas corretas
CREATE POLICY "Students can create own workout sessions" 
ON workout_sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Students can view own workout sessions" 
ON workout_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Professors can view student workout sessions" 
ON workout_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM workout_plans wp
    JOIN professor_profiles pp ON wp.professor_id = pp.id
    WHERE wp.id = workout_sessions.workout_plan_id 
    AND pp.user_id = auth.uid()
  )
);

-- Permitir que estudantes atualizem suas próprias sessões
CREATE POLICY "Students can update own workout sessions" 
ON workout_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM student_profiles sp 
    WHERE sp.id = workout_sessions.student_id 
    AND sp.user_id = auth.uid()
  )
);