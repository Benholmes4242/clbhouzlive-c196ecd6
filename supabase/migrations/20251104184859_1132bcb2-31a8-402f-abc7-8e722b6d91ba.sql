-- Create echo_threads table
CREATE TABLE IF NOT EXISTS public.echo_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create echo_messages table
CREATE TABLE IF NOT EXISTS public.echo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.echo_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_echo_threads_user_id ON public.echo_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_echo_threads_updated_at ON public.echo_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_echo_messages_thread_id ON public.echo_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_echo_messages_created_at ON public.echo_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.echo_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for echo_threads
CREATE POLICY "threads_select_own" ON public.echo_threads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "threads_insert_own" ON public.echo_threads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "threads_update_own" ON public.echo_threads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "threads_delete_own" ON public.echo_threads
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for echo_messages
CREATE POLICY "msgs_select_own" ON public.echo_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "msgs_insert_own" ON public.echo_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "msgs_delete_own" ON public.echo_messages
  FOR DELETE USING (user_id = auth.uid());

-- Trigger to update echo_threads.updated_at
CREATE OR REPLACE FUNCTION public.update_echo_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.echo_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON public.echo_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_echo_threads_updated_at();