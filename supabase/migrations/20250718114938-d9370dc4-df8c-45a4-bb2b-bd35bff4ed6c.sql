-- Corrigir políticas do storage bucket progress-photos para usar student_profiles
DROP POLICY IF EXISTS "Students can upload their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Professors can view all progress photos" ON storage.objects;

-- Política para upload de fotos (INSERT)
CREATE POLICY "Students with active plan can upload progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id::text = (storage.foldername(name))[1]
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

-- Política para visualizar fotos próprias (SELECT)
CREATE POLICY "Students with active plan can view own progress photos storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'progress-photos' 
  AND EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id::text = (storage.foldername(name))[1]
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

-- Política para atualizar fotos próprias (UPDATE)
CREATE POLICY "Students with active plan can update own progress photos storage" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'progress-photos' 
  AND EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id::text = (storage.foldername(name))[1]
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

-- Política para deletar fotos próprias (DELETE)
CREATE POLICY "Students with active plan can delete own progress photos storage" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'progress-photos' 
  AND EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.id::text = (storage.foldername(name))[1]
    AND sp.user_id = auth.uid()
    AND has_active_plan(auth.uid())
  )
);

-- Política para professores visualizarem todas as fotos
CREATE POLICY "Professors can view all progress photos storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'progress-photos' 
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'professor'
  )
);