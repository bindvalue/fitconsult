-- Função para criar um admin manualmente (apenas para uso administrativo)
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email text,
  admin_name text,
  admin_password text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Verificar se o usuário já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = admin_email) THEN
    RETURN 'Usuário já existe com este email';
  END IF;
  
  -- Criar usuário no auth.users via API não é possível diretamente
  -- Esta função servirá como guia para criar admin via interface do Supabase
  
  RETURN 'Para criar um admin, use o Supabase Dashboard:
1. Vá para Authentication > Users
2. Clique em "Create a new user"
3. Preencha email: ' || admin_email || ' e password: ' || admin_password || '
4. Em User Metadata, adicione: {"role": "admin", "name": "' || admin_name || '"}
5. O trigger handle_new_user criará automaticamente o usuário com role admin';
END;
$$;

-- Função para promover um usuário existente a admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Verificar se o usuário chamador é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;
  
  -- Encontrar o usuário pelo email
  SELECT id INTO target_user_id
  FROM public.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;
  
  -- Promover para admin
  UPDATE public.users 
  SET role = 'admin', status = 'active', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Comentário com instruções para criar o primeiro admin
COMMENT ON FUNCTION public.create_admin_user IS 'Para criar o primeiro admin:
1. No Supabase Dashboard, vá para Authentication > Users
2. Clique em "Create a new user"
3. Preencha email e password
4. Em User Metadata adicione: {"role": "admin", "name": "Nome do Admin"}
5. O sistema criará automaticamente o usuário com permissões de admin';