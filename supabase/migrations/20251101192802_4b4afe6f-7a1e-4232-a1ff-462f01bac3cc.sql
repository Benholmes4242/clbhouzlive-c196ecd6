-- Create trigger to always set host_user_id to the authenticated user on insert
CREATE OR REPLACE FUNCTION public.set_host_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always ensure host_user_id matches the JWT subject
  NEW.host_user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_host_user_id ON public.games;
CREATE TRIGGER trg_set_host_user_id
BEFORE INSERT ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.set_host_user_id();