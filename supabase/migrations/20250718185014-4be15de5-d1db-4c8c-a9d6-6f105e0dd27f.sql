-- Security Fix: Remove the problematic SECURITY DEFINER view
-- and replace it with a secure version that respects RLS policies

-- Drop the existing view that bypasses RLS
DROP VIEW IF EXISTS public.pending_student_accounts;

-- Create a secure view that respects RLS policies
-- This view will execute with SECURITY INVOKER (default), meaning it respects
-- the permissions of the user executing the query, not the view creator
CREATE VIEW public.pending_student_accounts
SECURITY INVOKER  -- Explicitly set to use invoker's permissions
AS
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

-- Enable RLS on the view (this is important for security)
ALTER VIEW public.pending_student_accounts SET (security_invoker = true);

-- Create specific RLS policy for this view access
-- Only professors should be able to access pending student accounts
CREATE POLICY "Professors can view pending student accounts via view"
ON public.pending_student_accounts
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'professor'
  )
);

-- Ensure the underlying tables have proper RLS policies
-- (These should already exist, but let's make sure)

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