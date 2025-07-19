-- Add account status to users table
ALTER TABLE public.users ADD COLUMN status CHARACTER VARYING NOT NULL DEFAULT 'pending';

-- Create enum for account status
CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'blocked', 'expired');

-- Update the status column to use the enum
ALTER TABLE public.users ALTER COLUMN status TYPE account_status USING status::account_status;

-- Update existing users to be active (for existing accounts)
UPDATE public.users SET status = 'active' WHERE status = 'pending';

-- Add index for better query performance
CREATE INDEX idx_users_status ON public.users(status);

-- Create function to check if user account is active
CREATE OR REPLACE FUNCTION public.is_account_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = user_id 
    AND u.status = 'active'
  );
$$;

-- Create function to activate student account (only professors can do this)
CREATE OR REPLACE FUNCTION public.activate_student_account(student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is a professor
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'professor'
  ) THEN
    RAISE EXCEPTION 'Only professors can activate student accounts';
  END IF;
  
  -- Check if target user is a student
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = student_user_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Target user must be a student';
  END IF;
  
  -- Activate the account
  UPDATE public.users 
  SET status = 'active', updated_at = NOW()
  WHERE id = student_user_id AND role = 'student';
  
  RETURN TRUE;
END;
$$;

-- Create function to block student account
CREATE OR REPLACE FUNCTION public.block_student_account(student_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is a professor
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'professor'
  ) THEN
    RAISE EXCEPTION 'Only professors can block student accounts';
  END IF;
  
  -- Block the account
  UPDATE public.users 
  SET status = 'blocked', updated_at = NOW()
  WHERE id = student_user_id AND role = 'student';
  
  RETURN TRUE;
END;
$$;

-- Update RLS policies to consider account status
-- Update existing policies for tables that need active accounts

-- Activity logs - only active accounts
DROP POLICY IF EXISTS "Students with active plan can create own activity logs" ON public.activity_logs;
CREATE POLICY "Students with active plan can create own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (
  auth.uid() = student_id 
  AND has_active_plan(auth.uid()) 
  AND is_account_active(auth.uid())
);

DROP POLICY IF EXISTS "Students with active plan can view own activity logs" ON public.activity_logs;
CREATE POLICY "Students with active plan can view own activity logs"
ON public.activity_logs FOR SELECT
USING (
  auth.uid() = student_id 
  AND has_active_plan(auth.uid()) 
  AND is_account_active(auth.uid())
);

-- Messages - only active accounts
DROP POLICY IF EXISTS "Users with active plan can send messages" ON public.messages;
CREATE POLICY "Users with active plan can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND (has_active_plan(auth.uid()) OR (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor')
  ))
  AND is_account_active(auth.uid())
);

DROP POLICY IF EXISTS "Users with active plan can view own messages" ON public.messages;
CREATE POLICY "Users with active plan can view own messages"
ON public.messages FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND (has_active_plan(auth.uid()) OR (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'professor')
  ))
  AND is_account_active(auth.uid())
);

-- Update users access policy to include account status
DROP POLICY IF EXISTS "Users access policy" ON public.users;
CREATE POLICY "Users access policy"
ON public.users FOR SELECT
USING (
  auth.uid() = id 
  OR (
    get_current_user_role() = 'professor' 
    AND role = 'student'
  )
);

-- Add policy for professors to manage student account status
CREATE POLICY "Professors can update student account status"
ON public.users FOR UPDATE
USING (
  get_current_user_role() = 'professor' 
  AND role = 'student'
)
WITH CHECK (
  get_current_user_role() = 'professor' 
  AND role = 'student'
);

-- Create view for professors to see pending student accounts
CREATE OR REPLACE VIEW public.pending_student_accounts AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.status,
  u.created_at,
  sp.age,
  sp.phone,
  sp.emergency_contact
FROM public.users u
LEFT JOIN public.student_profiles sp ON u.id = sp.user_id
WHERE u.role = 'student' AND u.status = 'pending'
ORDER BY u.created_at DESC;

-- Grant access to the view for professors
GRANT SELECT ON public.pending_student_accounts TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Professors can view pending student accounts"
ON public.pending_student_accounts FOR SELECT
USING (get_current_user_role() = 'professor');