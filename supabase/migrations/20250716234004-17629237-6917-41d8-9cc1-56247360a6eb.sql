-- Remove the problematic height constraint that expects centimeters instead of meters
ALTER TABLE public.student_profiles 
DROP CONSTRAINT IF EXISTS valid_height;

-- Add a new constraint that accepts height in meters (1.0 to 2.5)
ALTER TABLE public.student_profiles 
ADD CONSTRAINT valid_height_meters 
CHECK (height IS NULL OR (height >= 1.0 AND height <= 2.5));