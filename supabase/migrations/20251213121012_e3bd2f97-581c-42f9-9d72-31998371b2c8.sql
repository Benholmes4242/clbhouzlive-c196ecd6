-- Add proof columns to business_verification_requests
ALTER TABLE public.business_verification_requests
ADD COLUMN IF NOT EXISTS proof_method text,
ADD COLUMN IF NOT EXISTS proof_value text,
ADD COLUMN IF NOT EXISTS proof_metadata jsonb DEFAULT '{}'::jsonb;

-- Add index for exclusivity lookups
CREATE INDEX IF NOT EXISTS idx_bvr_proof_method_value ON public.business_verification_requests(proof_method, proof_value) WHERE status = 'approved';

-- Comment for clarity
COMMENT ON COLUMN public.business_verification_requests.proof_method IS 'Type of proof: official_website, business_email, registered_business, creator_business, golf_course';
COMMENT ON COLUMN public.business_verification_requests.proof_value IS 'The primary proof value (URL, email, registration number)';
COMMENT ON COLUMN public.business_verification_requests.proof_metadata IS 'Additional metadata like registry type for registered businesses';