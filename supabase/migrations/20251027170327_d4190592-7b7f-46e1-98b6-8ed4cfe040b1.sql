-- Add new columns to user_nearby_status for V2 visibility and open-to-play
ALTER TABLE public.user_nearby_status
ADD COLUMN IF NOT EXISTS visibility_mode text
  CHECK (visibility_mode IN ('all', 'friends', 'hidden'))
  DEFAULT 'hidden';

ALTER TABLE public.user_nearby_status
ADD COLUMN IF NOT EXISTS open_to_play_active boolean DEFAULT false;

ALTER TABLE public.user_nearby_status
ADD COLUMN IF NOT EXISTS open_to_play_expires_at timestamptz;

-- Update RLS policies for new visibility logic
DROP POLICY IF EXISTS "nearby_select_non_hidden" ON public.user_nearby_status;
CREATE POLICY "nearby_select_non_hidden"
ON public.user_nearby_status
FOR SELECT
USING (visibility_mode != 'hidden');

-- Ensure users can still insert/update their own row
DROP POLICY IF EXISTS "nearby_insert_self" ON public.user_nearby_status;
CREATE POLICY "nearby_insert_self"
ON public.user_nearby_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "nearby_update_self" ON public.user_nearby_status;
CREATE POLICY "nearby_update_self"
ON public.user_nearby_status
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);