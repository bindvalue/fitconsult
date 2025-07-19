-- Add RLS policy to allow users to edit their own messages
CREATE POLICY "Users can edit own messages within time limit"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = sender_id 
  AND (
    has_active_plan(auth.uid()) 
    OR (
      EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'professor'
      )
    )
  )
  AND sent_at > (now() - interval '5 minutes')
)
WITH CHECK (
  auth.uid() = sender_id 
  AND (
    has_active_plan(auth.uid()) 
    OR (
      EXISTS (
        SELECT 1 
        FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'professor'
      )
    )
  )
);