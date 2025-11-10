-- Fix: Enable RLS on admin_role_audit table
ALTER TABLE public.admin_role_audit ENABLE ROW LEVEL SECURITY;