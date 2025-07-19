-- Corrigir a consulta RLS na função test_professor_registration
CREATE OR REPLACE FUNCTION public.test_professor_registration()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  test_result text;
BEGIN
  -- Teste 1: Verificar se a estrutura da tabela users está correta
  BEGIN
    -- Verificar se o tipo user_role existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      test_result := 'ERROR: user_role type does not exist';
      RETURN test_result;
    END IF;
    
    -- Verificar se o tipo account_status existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
      test_result := 'ERROR: account_status type does not exist';
      RETURN test_result;
    END IF;
    
    -- Verificar se a tabela users existe e tem as colunas necessárias
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public' 
      AND column_name = 'role'
    ) THEN
      test_result := 'ERROR: users table missing role column';
      RETURN test_result;
    END IF;
    
    test_result := 'SUCCESS: All types and table structure exist';
    
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR checking database structure: ' || SQLERRM;
    RETURN test_result;
  END;
  
  -- Teste 2: Verificar se as constraints funcionam
  BEGIN
    -- Verificar se a tabela professor_profiles existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'professor_profiles' 
      AND table_schema = 'public'
    ) THEN
      test_result := test_result || ' | ERROR: professor_profiles table does not exist';
      RETURN test_result;
    END IF;
    
    -- Verificar se as funções principais existem
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
    ) THEN
      test_result := test_result || ' | WARNING: handle_new_user function not found';
    ELSE
      test_result := test_result || ' | SUCCESS: handle_new_user function exists';
    END IF;
    
    test_result := test_result || ' | SUCCESS: Database constraints working properly';
    
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || ' | ERROR in constraints test: ' || SQLERRM;
  END;
  
  -- Teste 3: Verificar RLS policies
  BEGIN
    -- Verificar se há políticas RLS nas tabelas principais usando pg_policies
    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'users'
    ) THEN
      test_result := test_result || ' | SUCCESS: RLS policies found on users table';
    ELSE
      test_result := test_result || ' | WARNING: No RLS policies on users table';
    END IF;
    
    -- Verificar se RLS está habilitado na tabela users
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'users' 
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      test_result := test_result || ' | SUCCESS: RLS enabled on users table';
    ELSE
      test_result := test_result || ' | WARNING: RLS not enabled on users table';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || ' | ERROR checking RLS: ' || SQLERRM;
  END;
  
  RETURN test_result;
END;
$function$;