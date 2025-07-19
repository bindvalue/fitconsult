-- Criar enum user_role e atualizar estrutura para admin

-- Primeiro, criar o enum user_role
CREATE TYPE public.user_role AS ENUM ('student', 'professor', 'admin');

-- Atualizar a tabela users para usar o enum
ALTER TABLE public.users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Atualizar a função handle_new_user para definir status correto baseado no role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'admin' THEN 'active'::public.account_status
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'professor' THEN 'pending'::public.account_status
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
  ELSIF (NEW.raw_user_meta_data->>'role' = 'admin') THEN
    -- Admin não precisa de profile específico
    NULL;
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