-- Remover a função que não está sendo usada
DROP FUNCTION IF EXISTS public.auth_user_role();

-- Verificar se a política atual está causando problemas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;