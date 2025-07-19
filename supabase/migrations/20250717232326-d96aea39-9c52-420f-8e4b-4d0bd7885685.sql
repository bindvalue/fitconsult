-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

-- Create policies for progress photos bucket
CREATE POLICY "Students can upload their own progress photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own progress photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Professors can view all progress photos" 
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

CREATE POLICY "Students can update their own progress photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can delete their own progress photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add professor comment column to progress_photos table
ALTER TABLE progress_photos 
ADD COLUMN professor_comment text;

-- Add weight and measurements columns for better progress tracking
ALTER TABLE progress_photos 
ADD COLUMN weight numeric,
ADD COLUMN measurements jsonb,
ADD COLUMN is_baseline boolean DEFAULT false;