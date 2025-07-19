-- Função para transformar um usuário existente em admin
CREATE OR REPLACE FUNCTION public.upgrade_user_to_admin(user_email text, admin_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Buscar o UUID do usuário pelo email na tabela auth.users
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'Usuário não encontrado com email: ' || user_email;
  END IF;
  
  -- Inserir ou atualizar na tabela public.users
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    user_uuid,
    user_email,
    admin_name,
    'admin'::user_role,
    'active'::public.account_status
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    status = 'active'::public.account_status,
    name = admin_name;
  
  RETURN 'Usuário ' || user_email || ' foi promovido a admin com sucesso!';
END;
$$;