
INSERT INTO public.user_roles (user_id, role) 
VALUES ('6a5bcbb9-c22c-4655-ad8e-088b2858ca3e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
