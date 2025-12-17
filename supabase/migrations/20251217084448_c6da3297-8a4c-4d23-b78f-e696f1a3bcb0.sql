-- Create stream_assets table to track Cloudflare Stream video assets
CREATE TABLE IF NOT EXISTS public.stream_assets (
  uid TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'reserved',
  post_id UUID NULL REFERENCES public.posts(id) ON DELETE SET NULL
);

-- Add status check constraint
ALTER TABLE public.stream_assets
ADD CONSTRAINT stream_assets_status_check
CHECK (status IN ('reserved', 'attached', 'deleted'));

-- Create index for cleanup queries
CREATE INDEX idx_stream_assets_status_created ON public.stream_assets(status, created_at) 
WHERE status = 'reserved';

-- Enable RLS
ALTER TABLE public.stream_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own assets
CREATE POLICY "read_own_stream_assets"
ON public.stream_assets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "insert_own_stream_assets"
ON public.stream_assets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_stream_assets"
ON public.stream_assets FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_stream_assets"
ON public.stream_assets FOR DELETE
USING (user_id = auth.uid());