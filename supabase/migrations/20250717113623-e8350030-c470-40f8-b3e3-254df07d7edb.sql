-- Add progress tracking fields to workout_plans table
ALTER TABLE public.workout_plans 
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN current_week INTEGER DEFAULT 1,
ADD COLUMN completed_weeks INTEGER DEFAULT 0,
ADD COLUMN last_workout_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add progress tracking table for individual workout sessions
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on workout_sessions
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_sessions
CREATE POLICY "Students can create own workout sessions"
ON public.workout_sessions
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own workout sessions"
ON public.workout_sessions
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Professors can view student workout sessions"
ON public.workout_sessions
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_plans wp
  JOIN public.professor_profiles pp ON wp.professor_id = pp.id
  WHERE wp.id = workout_plan_id AND pp.user_id = auth.uid()
));

-- Function to update workout plan progress
CREATE OR REPLACE FUNCTION public.update_workout_plan_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completed_weeks and current_week based on workout_sessions
  UPDATE public.workout_plans 
  SET 
    completed_weeks = (
      SELECT COUNT(DISTINCT week_number) 
      FROM public.workout_sessions 
      WHERE workout_plan_id = NEW.workout_plan_id
    ),
    current_week = LEAST(
      (SELECT COALESCE(MAX(week_number), 1) FROM public.workout_sessions WHERE workout_plan_id = NEW.workout_plan_id) + 1,
      duration_weeks
    ),
    last_workout_date = NEW.completed_at
  WHERE id = NEW.workout_plan_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update progress when workout session is completed
CREATE TRIGGER update_workout_progress
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workout_plan_progress();

-- Initialize existing workout plans with proper started_at date
UPDATE public.workout_plans 
SET started_at = created_at
WHERE started_at IS NULL;