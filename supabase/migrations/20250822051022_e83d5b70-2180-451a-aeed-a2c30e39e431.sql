-- Enable real-time for caddie_logs table
ALTER TABLE public.caddie_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.caddie_logs;