-- Security Fix: Change ownership of the view to avoid SECURITY DEFINER issues
-- The view is still owned by 'postgres' superuser which causes security concerns

-- First, let's check if there's a way to change the owner
-- Since we may not be able to change ownership directly, let's ensure the view
-- is completely recreated with proper security context

-- Drop and recreate the view to ensure it's created with current user context
DROP VIEW IF EXISTS public.pending_student_accounts CASCADE;

-- For better security, let's not use a view at all
-- Instead, let's update the application to use the secure function we created
-- or create a more secure approach

-- Create a secure function that explicitly checks permissions
CREATE OR REPLACE FUNCTION public.list_pending_student_accounts()
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
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Check if the current user is a professor
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'professor'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only professors can view pending student accounts';
    END IF;

    -- Return the data
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.status::text,
        u.created_at,
        sp.age,
        sp.phone,
        sp.emergency_contact
    FROM public.users u
    LEFT JOIN public.student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student' 
      AND u.status = 'pending'
    ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.list_pending_student_accounts() TO authenticated;

-- Fix the remaining functions with missing search_path
-- Update get_pending_student_accounts function
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
SECURITY INVOKER
STABLE
SET search_path = ''
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
    FROM public.users u
    LEFT JOIN public.student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student' 
      AND u.status = 'pending'
      AND EXISTS (
        SELECT 1 
        FROM public.users prof
        WHERE prof.id = auth.uid() 
        AND prof.role = 'professor'
      )
    ORDER BY u.created_at DESC;
$$;

-- Add comments
COMMENT ON FUNCTION public.list_pending_student_accounts() IS 'Secure function to list pending student accounts with explicit permission checks';
COMMENT ON FUNCTION public.get_pending_student_accounts() IS 'Secure function to access pending student accounts with proper authorization checks and search_path protection';