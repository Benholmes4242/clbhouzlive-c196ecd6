-- Drop the restrictive existing policy
DROP POLICY IF EXISTS "Users can view trips they created" ON public.trips;

-- Create a security definer function to check trip visibility
-- This avoids infinite recursion by using a function to check trip_participants
CREATE OR REPLACE FUNCTION public.can_view_trip(check_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is the trip creator
    SELECT 1 FROM trips WHERE id = check_trip_id AND created_by = auth.uid()
  ) OR EXISTS (
    -- User is a participant in this trip
    SELECT 1 FROM trip_participants WHERE trip_id = check_trip_id AND user_id = auth.uid()
  )
$$;

-- Create new policy that allows viewing trips user created OR participates in
CREATE POLICY "Users can view trips they created or participate in"
ON public.trips
FOR SELECT
USING (public.can_view_trip(id));