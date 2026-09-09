CREATE OR REPLACE FUNCTION public.get_stat_browse_facets()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'countries', COALESCE((
      SELECT jsonb_agg(x ORDER BY (x->>'courses')::int DESC, x->>'sub_country')
      FROM (
        SELECT jsonb_build_object(
                 'country', b.country,
                 'sub_country', b.sub_country,
                 'courses', COUNT(*)::int,
                 'directory_total', (SELECT COUNT(*)::int FROM public.golf_courses g
                                     WHERE g.sub_country = b.sub_country),
                 'lens_counts', jsonb_build_object(
                   'toughest',  COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
                   'scoreable', COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
                   'played',    COUNT(*)::int,
                   'longest',   COUNT(*) FILTER (WHERE b.total_yards      IS NOT NULL)::int,
                   'rated',     COUNT(*) FILTER (WHERE b.community_rating IS NOT NULL)::int,
                   'chase',     COUNT(*) FILTER (WHERE b.open_crowns > 0)::int
                 )
               ) AS x
        FROM public.stat_browse_base b
        WHERE b.sub_country IS NOT NULL
        GROUP BY b.country, b.sub_country
      ) q
    ), '[]'::jsonb),
    'regions', COALESCE((
      SELECT jsonb_agg(x ORDER BY x->>'sub_country', (x->>'courses')::int DESC)
      FROM (
        SELECT jsonb_build_object(
                 'sub_country', b.sub_country,
                 'region', b.region,
                 'courses', COUNT(*)::int,
                 'lens_counts', jsonb_build_object(
                   'toughest',  COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
                   'scoreable', COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
                   'played',    COUNT(*)::int,
                   'longest',   COUNT(*) FILTER (WHERE b.total_yards      IS NOT NULL)::int,
                   'rated',     COUNT(*) FILTER (WHERE b.community_rating IS NOT NULL)::int,
                   'chase',     COUNT(*) FILTER (WHERE b.open_crowns > 0)::int
                 )
               ) AS x
        FROM public.stat_browse_base b
        WHERE b.sub_country IS NOT NULL AND b.region IS NOT NULL
        GROUP BY b.sub_country, b.region
      ) q
    ), '[]'::jsonb),
    'lens_counts_all', (
      SELECT jsonb_build_object(
        'toughest',  COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
        'scoreable', COUNT(*) FILTER (WHERE b.avg_to_par       IS NOT NULL)::int,
        'played',    COUNT(*)::int,
        'longest',   COUNT(*) FILTER (WHERE b.total_yards      IS NOT NULL)::int,
        'rated',     COUNT(*) FILTER (WHERE b.community_rating IS NOT NULL)::int,
        'chase',     COUNT(*) FILTER (WHERE b.open_crowns > 0)::int
      )
      FROM public.stat_browse_base b
    ),
    'played_total',    (SELECT COUNT(*)::int FROM public.stat_browse_base),
    'directory_total', (SELECT COUNT(*)::int FROM public.golf_courses),
    'all_played_total', (SELECT COUNT(DISTINCT r.course_id)::int FROM public.gam_round_stats r WHERE r.course_id IS NOT NULL),
    'rated_total', (SELECT COUNT(DISTINCT a.course_id)::int FROM public.course_rating_aggregates a WHERE a.avg_overall_score IS NOT NULL)
  );
$function$;