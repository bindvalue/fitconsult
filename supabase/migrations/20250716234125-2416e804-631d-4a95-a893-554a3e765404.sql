-- Remove all height-related constraints
ALTER TABLE public.student_profiles 
DROP CONSTRAINT IF EXISTS valid_height;

-- Update existing data to convert from centimeters to meters where needed
UPDATE public.student_profiles 
SET height = height / 100 
WHERE height IS NOT NULL AND height > 10;

-- Add the correct constraint for meters
ALTER TABLE public.student_profiles 
ADD CONSTRAINT valid_height_meters 
CHECK (height IS NULL OR (height >= 1.0 AND height <= 2.5));