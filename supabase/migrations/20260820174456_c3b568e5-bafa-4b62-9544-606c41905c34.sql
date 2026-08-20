CREATE TABLE public.whs_connect_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'england_golf',
  outcome text NOT NULL DEFAULT 'started',
  error_code text,
  failure_reason text,
  eg_status integer,
  connection_id uuid,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX whs_connect_attempts_user_created_idx ON public.whs_connect_attempts (user_id, created_at DESC);

GRANT SELECT ON public.whs_connect_attempts TO authenticated;
GRANT ALL ON public.whs_connect_attempts TO service_role;

ALTER TABLE public.whs_connect_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own connect attempts"
ON public.whs_connect_attempts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all connect attempts"
ON public.whs_connect_attempts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));