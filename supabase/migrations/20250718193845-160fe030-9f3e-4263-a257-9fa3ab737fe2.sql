-- Função de teste para verificar se o cadastro está funcionando
CREATE OR REPLACE FUNCTION public.test_professor_registration()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  test_result text;
BEGIN
  -- Testar se é possível inserir um professor
  BEGIN
    INSERT INTO public.users (id, email, name, role, status) VALUES 
    (gen_random_uuid(), 'test@example.com', 'Test Professor', 'professor', 'pending');
    
    test_result := 'SUCCESS: Users table insert working';
    
    -- Limpar teste
    DELETE FROM public.users WHERE email = 'test@example.com';
    
  EXCEPTION WHEN OTHERS THEN
    test_result := 'ERROR in users table: ' || SQLERRM;
    RETURN test_result;
  END;
  
  -- Testar se é possível inserir no professor_profiles
  BEGIN
    DECLARE
      test_user_id uuid := gen_random_uuid();
    BEGIN
      INSERT INTO public.users (id, email, name, role, status) VALUES 
      (test_user_id, 'test2@example.com', 'Test Professor 2', 'professor', 'pending');
      
      INSERT INTO public.professor_profiles (user_id, cref, specialization, experience_years, bio) VALUES
      (test_user_id, 'TEST123', 'Test Specialization', 5, 'Test bio');
      
      test_result := test_result || ' | SUCCESS: Professor profiles table insert working';
      
      -- Limpar teste
      DELETE FROM public.professor_profiles WHERE user_id = test_user_id;
      DELETE FROM public.users WHERE id = test_user_id;
      
    EXCEPTION WHEN OTHERS THEN
      test_result := test_result || ' | ERROR in professor_profiles: ' || SQLERRM;
      -- Limpar qualquer registro que tenha sido criado
      DELETE FROM public.users WHERE email = 'test2@example.com';
    END;
  END;
  
  RETURN test_result;
END;
$$;

-- Executar teste
SELECT public.test_professor_registration();