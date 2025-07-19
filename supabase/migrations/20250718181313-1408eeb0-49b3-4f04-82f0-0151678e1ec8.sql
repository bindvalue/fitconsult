-- Corrigir função activate_student_account - remover ambiguidade na coluna selected_plan
CREATE OR REPLACE FUNCTION public.activate_student_account(student_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  student_profile_id uuid;
  selected_plan text;
BEGIN
  -- Check if current user is a professor
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'professor'
  ) THEN
    RAISE EXCEPTION 'Only professors can activate student accounts';
  END IF;
  
  -- Check if target user is a student
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = student_user_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Target user must be a student';
  END IF;
  
  -- Get student profile info
  SELECT id, COALESCE(sp.selected_plan, 'basic') INTO student_profile_id, selected_plan
  FROM public.student_profiles sp 
  WHERE sp.user_id = student_user_id;
  
  -- Activate the account
  UPDATE public.users 
  SET status = 'active', updated_at = NOW()
  WHERE id = student_user_id AND role = 'student';
  
  -- Create subscription based on selected plan
  IF selected_plan = 'premium' THEN
    INSERT INTO public.subscriptions (student_id, plan_type, starts_at, expires_at, active)
    VALUES (
      student_profile_id,
      'premium'::public.subscription_plan,
      NOW(),
      NOW() + INTERVAL '30 days',
      true
    );
  ELSE
    INSERT INTO public.subscriptions (student_id, plan_type, starts_at, expires_at, active)
    VALUES (
      student_profile_id,
      'basic'::public.subscription_plan,
      NOW(),
      NOW() + INTERVAL '30 days',
      true
    );
  END IF;
  
  RETURN TRUE;
END;
$$;