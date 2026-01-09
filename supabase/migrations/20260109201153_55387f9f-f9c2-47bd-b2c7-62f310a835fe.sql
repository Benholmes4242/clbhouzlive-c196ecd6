-- Trip Timeline Notes table for storing notes within trip timelines
CREATE TABLE IF NOT EXISTS public.trip_timeline_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  text text NOT NULL,
  occurs_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trip_timeline_notes_trip ON public.trip_timeline_notes(trip_id, occurs_at, created_at);
CREATE INDEX IF NOT EXISTS idx_trip_timeline_notes_creator ON public.trip_timeline_notes(created_by, created_at DESC);

-- Enable RLS
ALTER TABLE public.trip_timeline_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Trip participants can read notes
CREATE POLICY "Trip participants can read notes"
ON public.trip_timeline_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trip_participants tp
  WHERE tp.trip_id = trip_timeline_notes.trip_id
    AND tp.user_id = auth.uid()
));

-- RLS: Creators can insert notes
CREATE POLICY "Creators can insert notes"
ON public.trip_timeline_notes
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- RLS: Creators can update their own notes
CREATE POLICY "Creators can update notes"
ON public.trip_timeline_notes
FOR UPDATE
USING (auth.uid() = created_by);

-- RLS: Creators can delete their own notes
CREATE POLICY "Creators can delete notes"
ON public.trip_timeline_notes
FOR DELETE
USING (auth.uid() = created_by);