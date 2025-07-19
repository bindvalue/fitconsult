-- Adicionar role de admin e atualizar lógica de professores

-- Primeiro, vamos atualizar o enum de roles para incluir admin
ALTER TYPE public.user_role ADD VALUE 'admin';

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
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
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
    -- Admin não precisa de profile específico, apenas entrada na tabela users
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

-- Criar função para listar professores pendentes (para admin)
CREATE OR REPLACE FUNCTION public.list_pending_professors()
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  status text,
  created_at timestamp with time zone,
  cref text,
  specialization text,
  experience_years integer,
  bio text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can view pending professors';
  END IF;

  -- Return the data
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.status::text,
    u.created_at,
    pp.cref,
    pp.specialization,
    pp.experience_years,
    pp.bio
  FROM public.users u
  LEFT JOIN public.professor_profiles pp ON u.id = pp.user_id
  WHERE u.role = 'professor' 
    AND u.status = 'pending'
  ORDER BY u.created_at DESC;
END;
$$;

-- Criar função para aprovar professor (para admin)
CREATE OR REPLACE FUNCTION public.approve_professor(professor_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve professors';
  END IF;
  
  -- Check if target user is a pending professor
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = professor_user_id AND role = 'professor' AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Target user must be a pending professor';
  END IF;
  
  -- Approve the professor
  UPDATE public.users 
  SET status = 'active', updated_at = NOW()
  WHERE id = professor_user_id AND role = 'professor';
  
  RETURN TRUE;
END;
$$;

-- Criar função para rejeitar professor (para admin)
CREATE OR REPLACE FUNCTION public.reject_professor(professor_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject professors';
  END IF;
  
  -- Check if target user is a pending professor
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = professor_user_id AND role = 'professor' AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Target user must be a pending professor';
  END IF;
  
  -- Reject the professor
  UPDATE public.users 
  SET status = 'blocked', updated_at = NOW()
  WHERE id = professor_user_id AND role = 'professor';
  
  RETURN TRUE;
END;
$$;

-- Atualizar políticas RLS para incluir admin
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update professor status" 
ON public.users 
FOR UPDATE 
USING (get_current_user_role() = 'admin' AND role = 'professor')
WITH CHECK (get_current_user_role() = 'admin' AND role = 'professor');

-- Política para admin visualizar perfis de professores
CREATE POLICY "Admins can view professor profiles" 
ON public.professor_profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');