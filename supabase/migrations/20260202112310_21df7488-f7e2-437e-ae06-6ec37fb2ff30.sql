
-- Add venue-to-course mappings for professional golf tournaments
-- This enables the hero carousel to display course photos instead of gradient fallbacks

-- Phase 1: PGA Tour Major Venues
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('Augusta National Golf Club', '5c8c46b7-20da-417f-a250-b67da8a6652c', 1.00, 'manual', NOW(), NOW()),
  ('TPC Sawgrass', '4387abe2-9bae-4c20-8431-765633d4f973', 1.00, 'manual', NOW(), NOW()),
  ('Southern Hills Country Club', 'bf7bfaef-7f4c-4b03-8e9b-e0acdc4adaae', 1.00, 'manual', NOW(), NOW()),
  ('Valhalla Golf Club', 'f81b0b0f-785c-4335-93e5-bed1ae6cc1bf', 1.00, 'manual', NOW(), NOW()),
  ('Pinehurst No. 2', '9b5d658e-ea3c-44cc-8edd-b0023f6ff148', 1.00, 'manual', NOW(), NOW()),
  ('Oakmont Country Club', '45ec685e-077c-499c-83d2-2562222f5ad6', 1.00, 'manual', NOW(), NOW()),
  ('Pebble Beach Golf Links', 'bca45458-953a-4514-8a3c-217f1b78f7eb', 1.00, 'manual', NOW(), NOW()),
  ('Royal Liverpool', '969c9090-b242-4ee7-8961-daf3d01d25ed', 1.00, 'manual', NOW(), NOW()),
  ('Royal Troon', 'f29aeed9-8682-4f34-a4e2-d390841cf5cf', 1.00, 'manual', NOW(), NOW()),
  ('St Andrews Links', '9bcbd3c5-6a74-49d6-869f-bfc11a30ce60', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();

-- Phase 2: PGA Tour Signature Events
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('Arnold Palmer''s Bay Hill Club & Lodge', 'c198d290-716a-4df7-9efb-34122997d54a', 1.00, 'manual', NOW(), NOW()),
  ('Bay Hill Club & Lodge', 'c198d290-716a-4df7-9efb-34122997d54a', 1.00, 'manual', NOW(), NOW()),
  ('Riviera Country Club', '8fa00496-b2a0-4911-ae8d-fa2ecab059f0', 1.00, 'manual', NOW(), NOW()),
  ('TPC Scottsdale', '9c04adc5-b75c-4300-b145-fa2b73e29f15', 1.00, 'manual', NOW(), NOW()),
  ('Harbour Town Golf Links', '9c27ad1a-ffbc-42bb-ad91-a3d3d2f90362', 1.00, 'manual', NOW(), NOW()),
  ('Muirfield Village Golf Club', '04b72705-4b21-4c6c-b841-10a7aff8b5d3', 1.00, 'manual', NOW(), NOW()),
  ('Quail Hollow Club', 'd1d35477-fb24-45e8-bea5-34d596580a9b', 1.00, 'manual', NOW(), NOW()),
  ('Colonial Country Club', '6793200d-80fd-40bd-b164-62d706f2ca11', 1.00, 'manual', NOW(), NOW()),
  ('Detroit Golf Club', '45af3828-4780-425c-ab84-e2ef014512e5', 1.00, 'manual', NOW(), NOW()),
  ('TPC River Highlands', '54f53c74-ae73-4923-a5aa-b61fbb80a919', 1.00, 'manual', NOW(), NOW()),
  ('East Lake Golf Club', '057918fa-a76d-4c65-b557-76b3d15f4860', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();

-- Phase 3: Regular PGA Tour Events
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('La Quinta Country Club', 'f222b2c9-401d-412a-91fa-6a144612e89d', 1.00, 'manual', NOW(), NOW()),
  ('Caves Valley Golf Club', 'a04fe082-9bd0-4295-b3c7-8553bb6b021b', 1.00, 'manual', NOW(), NOW()),
  ('TPC Twin Cities', 'e5d43f8c-635d-4ba5-90da-12d6f641dca9', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();

-- Phase 4: LIV Golf Venues
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('Royal Greens Golf & Country Club', 'caf501d4-a801-4707-8074-e712af665bd9', 1.00, 'manual', NOW(), NOW()),
  ('Centurion Club', 'cd2b0374-a7f0-4253-a88e-d1537a1d8033', 1.00, 'manual', NOW(), NOW()),
  ('Trump National Doral', '870d3eb5-1a9c-463e-b816-4408059eb26a', 1.00, 'manual', NOW(), NOW()),
  ('The Grange Golf Club', 'a003bee3-dfb9-4e34-ad01-f3643ca9e6ef', 1.00, 'manual', NOW(), NOW()),
  ('Singapore Island Country Club', '365e96ea-d7ed-4e5b-be31-a32a2208ff68', 1.00, 'manual', NOW(), NOW()),
  ('Hong Kong Golf Club', '6069ff63-d54f-4598-b97d-67dac933834f', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();

-- Phase 5: DP World Tour / International Venues
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('Emirates Golf Club', 'de72cd6b-159a-45fa-b431-780dc1944deb', 1.00, 'manual', NOW(), NOW()),
  ('Jumeirah Golf Estates', 'a8eb7fd0-d9c6-4fa7-a23e-06ab2c616318', 1.00, 'manual', NOW(), NOW()),
  ('Wentworth Club', '2581c32a-e075-4e8c-9cd8-c803ad3ed221', 1.00, 'manual', NOW(), NOW()),
  ('Marco Simone Golf & Country Club', '1c899cdd-584e-45d4-ac6f-15922492f60d', 1.00, 'manual', NOW(), NOW()),
  ('Le Golf National', 'c2c1c864-cba2-434e-929b-a4f63a986e91', 1.00, 'manual', NOW(), NOW()),
  ('Valderrama Golf Club', '24322f61-753d-49e8-a59c-e3ef138cb4d3', 1.00, 'manual', NOW(), NOW()),
  ('Real Club Valderrama', '24322f61-753d-49e8-a59c-e3ef138cb4d3', 1.00, 'manual', NOW(), NOW()),
  ('Royal GC', 'e583cbec-7b98-4313-b254-5de59d29c4b5', 1.00, 'manual', NOW(), NOW()),
  ('Panama GC', 'e979c292-29d2-4e5b-9aea-c93bcc425f68', 1.00, 'manual', NOW(), NOW()),
  ('Panama Golf Club', 'e979c292-29d2-4e5b-9aea-c93bcc425f68', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();

-- Phase 6: LPGA Tour Venues
INSERT INTO sr_course_map (sr_venue_name, golf_course_id, confidence, source, created_at, updated_at)
VALUES 
  ('Mission Hills Country Club', 'd5dbe3e4-bd73-4793-9a99-542d17f224f8', 1.00, 'manual', NOW(), NOW()),
  ('Lancaster Country Club', 'e3accba4-55c6-43ee-9a7e-f11ab793b807', 1.00, 'manual', NOW(), NOW()),
  ('Baltusrol Golf Club', '4df4bd35-c874-42fb-b351-d60356e1d882', 1.00, 'manual', NOW(), NOW()),
  ('Congressional Country Club', 'e53433b2-96c5-4be3-89e3-32ef5b5f6d64', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (sr_venue_name) DO UPDATE SET 
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = NOW();
