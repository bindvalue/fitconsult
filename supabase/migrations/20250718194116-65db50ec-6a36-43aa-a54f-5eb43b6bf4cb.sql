-- Função para verificar problemas de cadastro
CREATE OR REPLACE FUNCTION public.debug_user_registration(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  auth_user_exists boolean;
  public_user_exists boolean;
  profile_exists boolean;
  user_id_auth uuid;
  user_id_public uuid;
  user_data jsonb;
BEGIN
  -- Verificar se existe na auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO auth_user_exists;
  
  -- Verificar se existe na public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = user_email) INTO public_user_exists;
  
  -- Obter IDs se existirem
  IF auth_user_exists THEN
    SELECT id INTO user_id_auth FROM auth.users WHERE email = user_email;
  END IF;
  
  IF public_user_exists THEN
    SELECT id INTO user_id_public FROM public.users WHERE email = user_email;
  END IF;
  
  -- Verificar se existe profile
  IF user_id_public IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.professor_profiles WHERE user_id = user_id_public) INTO profile_exists;
  END IF;
  
  -- Obter dados do usuário
  IF public_user_exists THEN
    SELECT row_to_json(u.*) INTO user_data 
    FROM public.users u 
    WHERE u.email = user_email;
  END IF;
  
  -- Construir resultado
  result := jsonb_build_object(
    'email', user_email,
    'auth_user_exists', auth_user_exists,
    'public_user_exists', public_user_exists,
    'profile_exists', profile_exists,
    'user_id_auth', user_id_auth,
    'user_id_public', user_id_public,
    'user_data', user_data
  );
  
  RETURN result;
END;
$$;