
-- Insert USA Top 100 courses that don't exist in worldwide rankings (courses 44-100)
INSERT INTO public.golf_courses (name, country, region, continent, global_rank, usa_rank, description, thumbnail_image) VALUES
('Baltusrol Golf Club (Lower)', 'United States', 'New Jersey', 'North America', NULL, 44, 'Baltusrol Golf Club''s roots run deep, its name linked to Baltus Roll, the original landowner. The club''s historic significance is matched by the quality of its courses.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Kiawah Island Golf Resort (Ocean)', 'United States', 'South Carolina', 'North America', NULL, 45, 'Pete Dye''s Ocean Course at Kiawah Island is ferocious and breathtaking. With more seaside holes than any course in the Northern Hemisphere, it''s a bucket-list experience.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('The Country Club (Clyde & Squirrel)', 'United States', 'Massachusetts', 'North America', NULL, 46, 'The Country Club at Brookline may sound unassuming, but it was the first of its kind in the US. Its 27-hole layout, unified by Gil Hanse, remains truly iconic.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Old Barnwell', 'United States', 'South Carolina', 'North America', NULL, 47, 'Old Barnwell redefines private golf. Modern yet steeped in ethos, this South Carolina layout does things differently—with thoughtful routing and a mission-driven club culture.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Old Sandwich Golf Club', 'United States', 'Massachusetts', 'North America', NULL, 48, 'Old Sandwich''s green complexes are a true highlight—subtle contours and stunning bunker work by Jeff Bradley make this one of New England''s hidden masterpieces.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Essex County Club', 'United States', 'Massachusetts', 'North America', NULL, 49, 'Essex County Club''s par-5 3rd hole is a beast—nearly as long as the previous two combined, it proves that strategy and shape are as important as sheer distance.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Winged Foot Golf Club (East)', 'United States', 'New York', 'North America', NULL, 50, 'Winged Foot''s East Course is another A.W. Tillinghast classic. Strategic, timeless and brutally elegant—it''s every bit the equal of its famous West sibling.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop');

-- Update existing courses with their USA rankings (first batch)
UPDATE public.golf_courses SET usa_rank = 1 WHERE name = 'Cypress Point Club';
UPDATE public.golf_courses SET usa_rank = 2 WHERE name = 'Pine Valley Golf Club';
UPDATE public.golf_courses SET usa_rank = 3 WHERE name = 'Shinnecock Hills Golf Club';
UPDATE public.golf_courses SET usa_rank = 4 WHERE name = 'National Golf Links of America';
UPDATE public.golf_courses SET usa_rank = 5 WHERE name = 'Oakmont Country Club';
UPDATE public.golf_courses SET usa_rank = 6 WHERE name = 'Sand Hills Golf Club';
UPDATE public.golf_courses SET usa_rank = 7 WHERE name = 'Merion Golf Club (East)';
UPDATE public.golf_courses SET usa_rank = 8 WHERE name = 'Augusta National Golf Club';
UPDATE public.golf_courses SET usa_rank = 9 WHERE name = 'Los Angeles Country Club (North)';
UPDATE public.golf_courses SET usa_rank = 10 WHERE name = 'Fishers Island Club';
