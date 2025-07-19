-- Remover a constraint antiga que não permite 'admin'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- A tabela já usa o enum user_role que permite 'student', 'professor', 'admin'
-- Então não precisamos de constraint adicional