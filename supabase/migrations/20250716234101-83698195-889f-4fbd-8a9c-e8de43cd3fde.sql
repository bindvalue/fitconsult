-- First, convert existing height data from centimeters to meters
UPDATE public.student_profiles 
SET height = height / 100 
WHERE height IS NOT NULL AND height > 10;

-- Now we can safely add the constraint for meters
ALTER TABLE public.student_profiles 
ADD CONSTRAINT valid_height_meters 
CHECK (height IS NULL OR (height >= 1.0 AND height <= 2.5));