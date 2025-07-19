-- Desabilitar temporariamente o trigger para permitir criação manual
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Criar função temporária para inserir admin manualmente
CREATE OR REPLACE FUNCTION public.create_admin_manually(
  user_id uuid,
  user_email text,
  user_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Inserir diretamente na tabela users
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    user_id,
    user_email,
    user_name,
    'admin'::user_role,
    'active'::public.account_status
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    status = 'active'::public.account_status,
    name = user_name,
    email = user_email;
    
  RETURN TRUE;
END;
$$;

-- Reabilitar o trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;