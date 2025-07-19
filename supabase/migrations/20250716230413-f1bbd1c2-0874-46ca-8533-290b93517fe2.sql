-- Phase 1: Critical Database Security Fixes

-- Fix 1: Secure the handle_new_user function by setting search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  -- Create profile based on role
  IF (NEW.raw_user_meta_data->>'role' = 'professor') THEN
    INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years, bio)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'cref',
      NEW.raw_user_meta_data->>'specialization',
      COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
      NEW.raw_user_meta_data->>'bio'
    );
  ELSE
    INSERT INTO public.student_profiles (user_id, age, height, weight, phone, emergency_contact, emergency_phone)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
      COALESCE((NEW.raw_user_meta_data->>'height')::numeric, NULL),
      COALESCE((NEW.raw_user_meta_data->>'weight')::numeric, NULL),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'emergency_contact',
      NEW.raw_user_meta_data->>'emergency_phone'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix 2: Secure the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix 3: Add missing INSERT policy for users table
CREATE POLICY "Allow user creation via trigger only" 
ON public.users 
FOR INSERT 
WITH CHECK (false);

-- Fix 4: Create security definer function for role checking to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Fix 5: Improve RLS policies with principle of least privilege

-- Update professor profiles policy to be more restrictive
DROP POLICY IF EXISTS "Professor profiles are viewable by everyone" ON public.professor_profiles;
CREATE POLICY "Authenticated users can view professor profiles" 
ON public.professor_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing audit logs for professors and the user's own actions
CREATE POLICY "Users can view own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id OR public.get_current_user_role() = 'professor');

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (false);

-- Fix 6: Add constraints for data validation
ALTER TABLE public.student_profiles 
ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 10 AND age <= 120)),
ADD CONSTRAINT valid_height CHECK (height IS NULL OR (height >= 100 AND height <= 250)),
ADD CONSTRAINT valid_weight CHECK (weight IS NULL OR (weight >= 30 AND weight <= 300));

-- Fix 7: Add constraint to prevent professor from being their own student
ALTER TABLE public.consultations 
ADD CONSTRAINT professor_not_student CHECK (professor_id != student_id);

ALTER TABLE public.workout_plans 
ADD CONSTRAINT professor_not_student CHECK (professor_id != student_id);