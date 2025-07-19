-- Adicionar coluna para armazenar o plano selecionado pelo estudante
ALTER TABLE public.student_profiles ADD COLUMN selected_plan text DEFAULT 'basic';

-- Atualizar a função handle_new_user para salvar o plano selecionado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Determine the initial status based on role
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'professor' THEN 'active'::public.account_status
      ELSE 'pending'::public.account_status
    END
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
    INSERT INTO public.student_profiles (user_id, age, height, weight, phone, emergency_contact, emergency_phone, selected_plan)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
      COALESCE((NEW.raw_user_meta_data->>'height')::numeric, NULL),
      COALESCE((NEW.raw_user_meta_data->>'weight')::numeric, NULL),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'emergency_contact',
      NEW.raw_user_meta_data->>'emergency_phone',
      COALESCE(NEW.raw_user_meta_data->>'plan', 'basic')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar a função de ativação para criar subscription se necessário
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
  SELECT id, COALESCE(selected_plan, 'basic') INTO student_profile_id, selected_plan
  FROM public.student_profiles 
  WHERE user_id = student_user_id;
  
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