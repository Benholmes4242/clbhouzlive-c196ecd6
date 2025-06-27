
-- Add the new 'limited_admin' role to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE 'limited_admin';
