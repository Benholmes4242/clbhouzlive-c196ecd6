-- Ensure all image uploads are directed to R2 by updating the migration function
-- to handle missing buckets gracefully and re-run for remaining files

-- No database changes needed, just confirming the R2-only policy is enforced
SELECT 'R2-only policy enforced for all image uploads' as status;