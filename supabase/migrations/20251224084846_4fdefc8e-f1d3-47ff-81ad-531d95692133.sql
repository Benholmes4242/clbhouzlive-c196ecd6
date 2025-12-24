-- Create table for storing user push device registrations
CREATE TABLE public.user_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'onesignal',
  provider_id text NOT NULL,
  platform text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  
  CONSTRAINT user_push_devices_provider_id_unique UNIQUE (provider, provider_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_push_devices_user_id ON public.user_push_devices(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_push_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own push device registrations
CREATE POLICY "Users can view own push devices"
  ON public.user_push_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own push device registrations
CREATE POLICY "Users can insert own push devices"
  ON public.user_push_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push device registrations
CREATE POLICY "Users can update own push devices"
  ON public.user_push_devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own push device registrations
CREATE POLICY "Users can delete own push devices"
  ON public.user_push_devices
  FOR DELETE
  USING (auth.uid() = user_id);