-- Create invite_requests table for gate lead capture
CREATE TABLE IF NOT EXISTS public.invite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  club TEXT,
  source TEXT DEFAULT 'gate',
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for this table (writes come from service-role edge function)
ALTER TABLE public.invite_requests DISABLE ROW LEVEL SECURITY;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_invite_requests_email ON public.invite_requests(email);
CREATE INDEX IF NOT EXISTS idx_invite_requests_created_at ON public.invite_requests(created_at DESC);