-- Função melhorada que verifica se o usuário já existe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_value text;
  user_name_value text;
  experience_years_value integer;
  user_exists boolean;
BEGIN
  -- Verificar se o usuário já existe na tabela public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
  
  -- Se o usuário já existe, não fazer nada
  IF user_exists THEN
    RETURN NEW;
  END IF;
  
  -- Validar e converter dados
  user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_name_value := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  
  -- Validar experience_years
  BEGIN
    experience_years_value := COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0);
  EXCEPTION WHEN OTHERS THEN
    experience_years_value := 0;
  END;
  
  -- Inserir na tabela users
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    user_name_value,
    user_role_value::public.user_role,
    CASE 
      WHEN user_role_value = 'admin' THEN 'active'::public.account_status
      WHEN user_role_value = 'professor' THEN 'pending'::public.account_status
      ELSE 'pending'::public.account_status
    END
  );
  
  -- Criar profile baseado no role
  IF user_role_value = 'professor' THEN
    INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years, bio)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'cref',
      NEW.raw_user_meta_data->>'specialization',
      experience_years_value,
      NEW.raw_user_meta_data->>'bio'
    );
  ELSIF user_role_value = 'student' THEN
    DECLARE
      age_value integer;
      height_value numeric;
      weight_value numeric;
    BEGIN
      -- Validar dados numéricos do estudante
      BEGIN
        age_value := (NEW.raw_user_meta_data->>'age')::integer;
      EXCEPTION WHEN OTHERS THEN
        age_value := NULL;
      END;
      
      BEGIN
        height_value := (NEW.raw_user_meta_data->>'height')::numeric;
      EXCEPTION WHEN OTHERS THEN
        height_value := NULL;
      END;
      
      BEGIN
        weight_value := (NEW.raw_user_meta_data->>'weight')::numeric;
      EXCEPTION WHEN OTHERS THEN
        weight_value := NULL;
      END;
      
      INSERT INTO public.student_profiles (user_id, age, height, weight, phone, emergency_contact, emergency_phone, selected_plan)
      VALUES (
        NEW.id,
        age_value,
        height_value,
        weight_value,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'emergency_contact',
        NEW.raw_user_meta_data->>'emergency_phone',
        COALESCE(NEW.raw_user_meta_data->>'plan', 'basic')
      );
    END;
  END IF;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging
  RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$;