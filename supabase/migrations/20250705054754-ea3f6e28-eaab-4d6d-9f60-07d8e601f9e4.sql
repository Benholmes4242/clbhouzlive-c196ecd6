-- Remove pending invitation for Benjamin's old email
DELETE FROM public.admin_invitations 
WHERE email = 'bholmes@clbhouz.co.uk';

-- Update Benjamin's admin profile with his new email
UPDATE public.admin_profiles 
SET email = 'benjamin@clbhouz.co.uk',
    updated_at = now()
WHERE user_id = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';