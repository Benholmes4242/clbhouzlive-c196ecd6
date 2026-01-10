-- Add status column to trips for soft-cancel support
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add cancelled_at for tracking when trip was cancelled
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add index for filtering active trips
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- Add constraint for valid status values
ALTER TABLE public.trips
ADD CONSTRAINT trips_status_check 
CHECK (status IN ('active', 'cancelled'));

-- Update any existing trips to be active (in case there are orphan cancelled ones)
UPDATE public.trips SET status = 'active' WHERE status IS NULL;