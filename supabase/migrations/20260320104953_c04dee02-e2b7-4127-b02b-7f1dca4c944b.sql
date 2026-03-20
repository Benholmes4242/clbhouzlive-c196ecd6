-- Drop stale podium overloads without privacy filter
DROP FUNCTION public.get_podium_all_time(p_scope text, p_current_user_id uuid, p_club_id uuid, p_country text);
DROP FUNCTION public.get_podium_seasonal(p_scope text, p_division_id text, p_current_user_id uuid, p_club_id uuid, p_country text);
DROP FUNCTION public.get_user_podium_proximity(p_user_id uuid, p_time_filter text, p_scope text, p_division_id text);