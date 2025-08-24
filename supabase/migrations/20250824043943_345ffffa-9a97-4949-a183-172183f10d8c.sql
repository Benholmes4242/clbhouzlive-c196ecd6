-- Run the image migration to R2
SELECT * FROM supabase.functions.invoke('migrate-all-images-to-r2');