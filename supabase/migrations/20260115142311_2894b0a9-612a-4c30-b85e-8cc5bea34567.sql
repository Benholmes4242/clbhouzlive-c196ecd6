-- Add context column to support_tickets for storing device/browser info
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.support_tickets.context IS 'Device/browser context collected automatically when reporting problems (user agent, screen size, URL, etc.)';