-- Add columns for image processing to post_media
ALTER TABLE public.post_media 
ADD COLUMN IF NOT EXISTS original_media_url text,
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error text,
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.post_media.original_media_url IS 'Original unedited media URL (before filters/text baked in)';
COMMENT ON COLUMN public.post_media.processing_status IS 'Status of image processing: pending, processing, complete, failed, skipped';
COMMENT ON COLUMN public.post_media.processing_error IS 'Error message if processing failed';
COMMENT ON COLUMN public.post_media.processed_at IS 'Timestamp when processing completed';

-- Create index for finding unprocessed media
CREATE INDEX IF NOT EXISTS idx_post_media_processing_status 
ON public.post_media(processing_status) 
WHERE processing_status IN ('pending', 'processing');