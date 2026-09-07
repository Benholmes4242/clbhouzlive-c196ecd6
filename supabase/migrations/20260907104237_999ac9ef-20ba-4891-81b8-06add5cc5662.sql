-- Functions are created with EXECUTE granted to PUBLIC by default, which the
-- linter flags for SECURITY DEFINER functions. The in-function can_moderate()
-- gate already refuses non-admins; this removes the surface entirely.
REVOKE EXECUTE ON FUNCTION public.get_admin_overview_metrics(integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_intraday(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_member_last_seen(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_glance(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_north_star() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_admin_overview_metrics(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_intraday(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_member_last_seen(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_glance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_north_star() TO authenticated;