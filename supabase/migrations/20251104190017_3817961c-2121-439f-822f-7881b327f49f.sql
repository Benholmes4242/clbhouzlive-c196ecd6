-- Ensure thread updated_at bumps on new messages
DROP TRIGGER IF EXISTS trg_echo_msgs_bump_thread ON public.echo_messages;
CREATE TRIGGER trg_echo_msgs_bump_thread
AFTER INSERT ON public.echo_messages
FOR EACH ROW EXECUTE FUNCTION public.update_echo_threads_updated_at();