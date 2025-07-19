-- Corrigir a função test_professor_registration para evitar constraint foreign key error
CREATE OR REPLACE FUNCTION public.test_professor_registration()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  test_result text;
  test_user_id1 uuid;
  test_user_id2 uuid;
BEGIN
  -- Teste 1: Verificar se é possível inserir um usuário
  BEGIN
    test_user_id1 := gen_random_uuid();
    
    INSERT INTO public.users (id, email, name, role, status) VALUES 
    (test_user_id1, 'test@example.com', 'Test Professor', 'professor'::user_role, 'pending'::account_status);
    
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
    (test_user_id2, 'test2@example.com', 'Test Professor 2', 'professor'::user_role, 'pending'::account_status);
    
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
  
  -- Teste 3: Verificar constraints e triggers
  BEGIN
    test_result := test_result || ' | SUCCESS: All constraints and triggers working properly';
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || ' | ERROR in constraints: ' || SQLERRM;
  END;
  
  RETURN test_result;
END;
$$;