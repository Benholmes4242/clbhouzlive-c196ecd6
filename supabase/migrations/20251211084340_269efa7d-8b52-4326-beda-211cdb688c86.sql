-- Delete the orphan test business entries (no username or different username)
DELETE FROM public.user_profiles
WHERE id IN (
  '3b0275f8-29e0-4394-a607-0641dc1b973e',  -- clbhouz athletes (no username)
  'c3bd7c79-1c27-4f9c-9fe3-5bd87a1fc347'   -- Sundridge Park Golf Club (username: spgc)
);

-- Reset benjaminholmes profile back to personal and clear business fields
UPDATE public.user_profiles
SET 
  profile_type = 'personal',
  business_name = NULL,
  business_bio = NULL,
  display_name = 'Benjamin Holmes'
WHERE id = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';