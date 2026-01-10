-- Create a security definer function to check trip participant access
CREATE OR REPLACE FUNCTION public.can_view_trip_participant(check_user_id uuid, check_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is the participant themselves
    SELECT 1 WHERE check_user_id = auth.uid()
  ) OR EXISTS (
    -- User is the trip creator
    SELECT 1 FROM trips WHERE id = check_trip_id AND created_by = auth.uid()
  ) OR EXISTS (
    -- User is a participant in this trip
    SELECT 1 FROM trip_participants WHERE trip_id = check_trip_id AND user_id = auth.uid()
  )
$$;

-- Drop the existing policy that causes recursion
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;

-- Create new policy using the security definer function
CREATE POLICY "Users can view trip participants" 
ON public.trip_participants 
FOR SELECT 
USING (public.can_view_trip_participant(user_id, trip_id));