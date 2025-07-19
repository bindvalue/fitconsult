-- Critical Database Security Fixes (Fixed Version)

-- Fix 1: Add additional input validation constraints
ALTER TABLE public.student_profiles 
ADD CONSTRAINT valid_phone_format CHECK (phone IS NULL OR phone ~ '^[0-9\+\-\s\(\)]+$'),
ADD CONSTRAINT valid_emergency_phone_format CHECK (emergency_phone IS NULL OR emergency_phone ~ '^[0-9\+\-\s\(\)]+$');

-- Fix 2: Add constraint to prevent self-referencing in messages
ALTER TABLE public.messages 
ADD CONSTRAINT no_self_messaging CHECK (sender_id != receiver_id);

-- Fix 3: Add indexes for better performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_users_email_role ON public.users(email, role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_expires ON public.subscriptions(active, expires_at);

-- Fix 4: Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, 
    old_values, new_values, ip_address, user_agent
  ) VALUES (
    auth.uid(), 
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
         WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
         ELSE NULL END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_subscriptions_changes ON public.subscriptions;
CREATE TRIGGER audit_subscriptions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- Fix 5: Add function to validate UUID inputs
CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  PERFORM input_text::uuid;
  RETURN TRUE;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER SET search_path = '';

-- Fix 6: Enhanced password security function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Minimum 12 characters
  IF LENGTH(password) < 12 THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain uppercase
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain lowercase
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain numbers
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain special characters
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER SET search_path = '';

-- Fix 7: Add constraint to prevent empty or null critical fields
ALTER TABLE public.users 
ADD CONSTRAINT users_email_not_empty CHECK (email IS NOT NULL AND LENGTH(TRIM(email)) > 0),
ADD CONSTRAINT users_name_not_empty CHECK (name IS NOT NULL AND LENGTH(TRIM(name)) > 0);

-- Fix 8: Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  ip_address inet,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT false
);

-- Enable RLS on rate limiting table
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only system and professors can manage rate limit logs
CREATE POLICY "System can manage rate limit logs" 
ON public.rate_limit_log 
FOR ALL 
USING (get_current_user_role() = 'professor');

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time 
ON public.rate_limit_log(user_id, action_type, attempted_at);