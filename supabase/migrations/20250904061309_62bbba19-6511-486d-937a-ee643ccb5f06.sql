-- Insert some sample coaches for demonstration
INSERT INTO public.coaches (user_id, name, academy, city, region, country, lat, lng, specialties, price_min, price_max, active) VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid, -- placeholder UUID
    'Sarah Johnson',
    'Pinehurst Golf Academy',
    'London',
    'Greater London',
    'United Kingdom',
    51.5074,
    -0.1278,
    ARRAY['Driver', 'Irons'],
    80,
    120,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid, -- placeholder UUID
    'Michael Thompson',
    'Royal Golf Club',
    'Edinburgh',
    'Scotland',
    'United Kingdom',
    55.9533,
    -3.1883,
    ARRAY['Short Game', 'Putting'],
    60,
    100,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid, -- placeholder UUID
    'Emma Wilson',
    'Elite Golf Performance',
    'Manchester',
    'Greater Manchester',
    'United Kingdom',
    53.4808,
    -2.2426,
    ARRAY['Driver', 'General'],
    90,
    150,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004'::uuid, -- placeholder UUID
    'James Mitchell',
    'The Golf Institute',
    'Birmingham',
    'West Midlands',
    'United Kingdom',
    52.4862,
    -1.8904,
    ARRAY['Irons', 'Short Game'],
    70,
    110,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005'::uuid, -- placeholder UUID
    'Rachel Davis',
    'Prestige Golf Academy',
    'Leeds',
    'West Yorkshire',
    'United Kingdom',
    53.8008,
    -1.5491,
    ARRAY['Putting', 'General'],
    65,
    95,
    true
  )
ON CONFLICT (id) DO NOTHING;