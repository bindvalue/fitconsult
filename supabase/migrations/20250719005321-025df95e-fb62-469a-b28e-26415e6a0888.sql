-- Recriar a função test_professor_registration para corrigir o erro do tipo user_role
CREATE OR REPLACE FUNCTION public.test_professor_registration()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  test_result text;
  test_user_id1 uuid;
  test_user_id2 uuid;
BEGIN
  -- Teste 1: Verificar se é possível inserir um usuário
  BEGIN
    test_user_id1 := gen_random_uuid();
    
    INSERT INTO public.users (id, email, name, role, status) VALUES 
    (test_user_id1, 'test@example.com', 'Test Professor', 'professor', 'pending');
    
    test_result := 'SUCCESS: Users table insert working';
    
    -- Limpar teste
    DELETE FROM public.users WHERE id = test_user_id1;
    
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR in users table: ' || SQLERRM;
    -- Tentar limpar mesmo em caso de erro
    BEGIN
      DELETE FROM public.users WHERE email = 'test@example.com';
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erro na limpeza
    END;
    RETURN test_result;
  END;
  
  -- Teste 2: Verificar se é possível inserir um professor com profile
  BEGIN
    test_user_id2 := gen_random_uuid();
    
    INSERT INTO public.users (id, email, name, role, status) VALUES 
    (test_user_id2, 'test2@example.com', 'Test Professor 2', 'professor', 'pending');
    
    INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years, bio) VALUES
    (test_user_id2, 'TEST123', 'Test Specialization', 5, 'Test bio');
    
    test_result := test_result || ' | SUCCESS: Professor profiles table insert working';
    
    -- Limpar teste na ordem correta (profile primeiro)
    DELETE FROM public.professor_profiles WHERE user_id = test_user_id2;
    DELETE FROM public.users WHERE id = test_user_id2;
    
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || ' | ERROR in professor_profiles: ' || SQLERRM;
    -- Tentar limpar na ordem correta mesmo em caso de erro
    BEGIN
      DELETE FROM public.professor_profiles WHERE user_id = test_user_id2;
      DELETE FROM public.users WHERE id = test_user_id2;
    EXCEPTION WHEN OTHERS THEN
      -- Tentar limpar por email como fallback
      BEGIN
        DELETE FROM public.users WHERE email = 'test2@example.com';
      EXCEPTION WHEN OTHERS THEN
        -- Ignorar erro na limpeza
      END;
    END;
  END;
  
  -- Teste 3: Verificar tipos e enums existem
  BEGIN
    -- Verificar se o tipo user_role existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      test_result := test_result || ' | ERROR: user_role type does not exist';
    ELSE
      test_result := test_result || ' | SUCCESS: user_role type exists';
    END IF;
    
    -- Verificar se o tipo account_status existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
      test_result := test_result || ' | ERROR: account_status type does not exist';
    ELSE
      test_result := test_result || ' | SUCCESS: account_status type exists';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || ' | ERROR checking types: ' || SQLERRM;
  END;
  
  RETURN test_result;
END;
$function$;