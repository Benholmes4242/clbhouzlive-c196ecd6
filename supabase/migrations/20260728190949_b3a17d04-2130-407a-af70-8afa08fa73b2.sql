INSERT INTO public.feed_config (key, value, description) VALUES
  ('t100_verdict_enabled', 1, 'Top 100 verdict band master switch (1 = on, 0 = off)'),
  ('t100_verdict_min_ratings', 3, 'Minimum member ratings before a Top 100 verdict band is shown'),
  ('t100_verdict_threshold', 0.5, 'Gap between member rating and rank-expected rating needed to show a Top 100 verdict band')
ON CONFLICT (key) DO NOTHING;