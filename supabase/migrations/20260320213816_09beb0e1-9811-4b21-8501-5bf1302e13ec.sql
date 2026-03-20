CREATE POLICY "ae_insert_anon"
ON public.analytics_events
FOR INSERT
TO anon
WITH CHECK (true);