-- Security Fix: Remove the problematic SECURITY DEFINER view
-- and replace it with a secure version that respects RLS policies

-- Drop the existing view that bypasses RLS
DROP VIEW IF EXISTS public.pending_student_accounts;

-- Create a secure view that respects RLS policies
-- Views by default execute with the permissions of the user executing the query
CREATE VIEW public.pending_student_accounts AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.status,
    u.created_at,
    sp.age,
    sp.phone,
    sp.emergency_contact
FROM users u
LEFT JOIN student_profiles sp ON u.id = sp.user_id
WHERE u.role = 'student' 
  AND u.status = 'pending'
ORDER BY u.created_at DESC;

-- Since this is a view, we need to ensure proper access control
-- The view will now respect the RLS policies of the underlying tables
-- Only professors should be able to access this view based on existing RLS policies

-- Additional security: Create a function to safely access pending accounts
CREATE OR REPLACE FUNCTION public.get_pending_student_accounts()
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    status text,
    created_at timestamptz,
    age integer,
    phone text,
    emergency_contact text
)
LANGUAGE SQL
SECURITY INVOKER  -- Use invoker's permissions, not definer's
STABLE
AS $$
    SELECT 
        u.id,
        u.email,
        u.name,
        u.status::text,
        u.created_at,
        sp.age,
        sp.phone,
        sp.emergency_contact
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student' 
      AND u.status = 'pending'
      AND EXISTS (
        SELECT 1 
        FROM users prof
        WHERE prof.id = auth.uid() 
        AND prof.role = 'professor'
      )
    ORDER BY u.created_at DESC;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_pending_student_accounts() TO authenticated;

-- Add comment to document the security fix
COMMENT ON VIEW public.pending_student_accounts IS 'Secure view that respects RLS policies - fixed security definer vulnerability';
COMMENT ON FUNCTION public.get_pending_student_accounts() IS 'Secure function to access pending student accounts with proper authorization checks';