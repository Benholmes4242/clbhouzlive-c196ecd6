-- Seed featured courses for Discover Courses section
INSERT INTO explore_featured_courses (course_id, source_label, card_media_url, card_type, sort_order, active)
VALUES 
  ('622610f7-7e53-404d-a5da-b9fb1e562e51', 'via Golf Monthly', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80', 'image', 1, true),
  ('29b33f45-7dd0-468b-ab29-046a0bda9832', 'via Golf Digest', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80', 'image', 2, true),
  ('ac3e9af6-87f3-4485-8e39-b0bcd2c82d82', 'via R&A', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&q=80', 'image', 3, true),
  ('debd502b-a086-483c-a4d9-02abaff962ef', 'via PGA Tour', 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80', 'image', 4, true)
ON CONFLICT DO NOTHING;