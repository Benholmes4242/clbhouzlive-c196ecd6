-- Enable realtime for business verification tables
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.business_verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.business_accounts REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_accounts;