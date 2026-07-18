ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_hidden_at timestamptz DEFAULT NULL;

CREATE POLICY "user hide own ticket"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());