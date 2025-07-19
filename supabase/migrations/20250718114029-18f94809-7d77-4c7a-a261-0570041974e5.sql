-- Remover políticas existentes para progress_photos
DROP POLICY IF EXISTS "Students with active plan can manage own progress photos" ON progress_photos;
DROP POLICY IF EXISTS "Students with active plan can view own progress photos" ON progress_photos;
DROP POLICY IF EXISTS "Professors can view student progress photos" ON progress_photos;

-- Criar novas políticas corrigidas
CREATE POLICY "Students with active plan can insert own progress photos" 
ON progress_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id = progress_photos.student_id 
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

CREATE POLICY "Students with active plan can select own progress photos" 
ON progress_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id = progress_photos.student_id 
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

CREATE POLICY "Students with active plan can update own progress photos" 
ON progress_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id = progress_photos.student_id 
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id = progress_photos.student_id 
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

CREATE POLICY "Students with active plan can delete own progress photos" 
ON progress_photos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id = progress_photos.student_id 
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

CREATE POLICY "Professors can view all progress photos" 
ON progress_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'professor'
  )
);

CREATE POLICY "Professors can update progress photos comments" 
ON progress_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'professor'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'professor'
  )
);