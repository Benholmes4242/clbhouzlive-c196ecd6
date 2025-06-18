
-- Insert golf courses ranked 61-100 in the world
INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Lytham & St Annes Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 'The most northerly Open venue in England, known for its bunkers and history.', 61, 20, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Lytham & St Annes Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Maidstone Club', 'United States', 'New York', 'North America', 'Willie Park Jr.''s classic routing across dunes on the Gardiner Peninsula.', 62, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Maidstone Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'South Cape Owners Club', 'South Korea', 'South Korea', 'Asia', 'A Kyle Phillips-designed cliffside marvel with views on every hole.', 63, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'South Cape Owners Club' AND country = 'South Korea');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'St George''s Golf & Country Club', 'Canada', 'Ontario', 'North America', 'Canada''s premier layout — narrow, rolling, and full of championship pedigree.', 64, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'St George''s Golf & Country Club' AND country = 'Canada');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Porthcawl Golf Club', 'United Kingdom', 'South Wales', 'Europe', 'Wales'' finest course — remote, understated, and consistently world-class.', 65, 21, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Porthcawl Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Sleepy Hollow Country Club', 'United States', 'New York', 'North America', 'C.B. Macdonald and Raynor brilliance perched above the Hudson River.', 66, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sleepy Hollow Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Myopia Hunt Club', 'United States', 'Massachusetts', 'North America', 'One of America''s earliest clubs, quirky and charming with equestrian roots.', 67, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Myopia Hunt Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'New South Wales Golf Club', 'Australia', 'New South Wales', 'Oceania', 'Dr Alister MacKenzie''s coastal gem with thrilling seaside holes.', 68, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'New South Wales Golf Club' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Kawana Hotel - Fuji Course', 'Japan', 'Chubu', 'Asia', 'Japan''s answer to Pebble Beach — dramatic clifftop golf with ocean views.', 69, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Kawana Hotel - Fuji Course' AND country = 'Japan');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cruden Bay Golf Club (Championship)', 'United Kingdom', 'North East Scotland', 'Europe', 'A quirky and fun links — beloved for its originality and beauty.', 70, 22, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cruden Bay Golf Club (Championship)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Eastward Ho!', 'United States', 'Massachusetts', 'North America', 'A charming Fowler design shaped by the sea and natural movement.', 71, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Eastward Ho!' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Ganton Golf Club', 'United Kingdom', 'Yorkshire', 'Europe', 'An inland course with links soul — sandy, strategic, and historic.', 72, 23, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ganton Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Jasper Park Lodge Golf Club', 'Canada', 'Alberta', 'North America', 'One of Canada''s most scenic courses — Stanley Thompson''s alpine masterpiece.', 73, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Jasper Park Lodge Golf Club' AND country = 'Canada');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Portmarnock Golf Club (Championship)', 'Ireland', 'Dublin', 'Europe', 'Bernard Darwin praised its final stretch as "the greatest finish in golf."', 74, 24, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Portmarnock Golf Club (Championship)' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Garden City Golf Club', 'United States', 'New York', 'North America', 'An exclusive, men-only enclave with rich architectural heritage.', 75, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Garden City Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Ballyneal Golf Club', 'United States', 'Colorado', 'North America', 'An inland links dream set in the wild dunes of Colorado.', 76, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ballyneal Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Trump International Golf Links Scotland - Old Course', 'United Kingdom', 'North East Scotland', 'Europe', 'Dramatic dunes and championship challenge along three miles of North Sea coast.', 77, 25, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Trump International Golf Links Scotland - Old Course' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Bandon Trails', 'United States', 'Oregon', 'North America', 'A wooded, inland complement to Bandon''s seaside layouts — pure Coore & Crenshaw.', 78, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bandon Trails' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Bandon Dunes', 'United States', 'Oregon', 'North America', 'The original course at the resort that changed American links golf forever.', 79, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bandon Dunes' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Lofoten Links', 'Norway', 'Norway', 'Europe', 'Wild, remote, and visually jaw-dropping golf above the Arctic Circle.', 80, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Lofoten Links' AND country = 'Norway');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Inverness Club', 'United States', 'Ohio', 'North America', 'Restored Donald Ross design with tournament pedigree and standout green sites.', 81, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Inverness Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Birkdale Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 'Often voted players'' favourite Open venue — fair, classic, and beautiful.', 82, 26, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Birkdale Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Rock Creek Cattle Company', 'United States', 'Montana', 'North America', 'Tom Doak''s rugged masterpiece in Big Sky Country.', 83, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Rock Creek Cattle Company' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cabot Cape Breton - Cliffs', 'Canada', 'Nova Scotia', 'North America', 'Clifftop golf in Canada''s Cape Breton — dramatic and diverse.', 84, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cabot Cape Breton - Cliffs' AND country = 'Canada');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'St George''s Hill Golf Club (Red & Blue)', 'United Kingdom', 'Surrey', 'Europe', 'The best of Colt''s architectural flair amid Surrey''s pine-strewn hills.', 85, 27, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'St George''s Hill Golf Club (Red & Blue)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Hague Golf Club', 'Netherlands', 'Netherlands', 'Europe', 'Rolling dunes, natural flow — one of Continental Europe''s finest.', 86, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Hague Golf Club' AND country = 'Netherlands');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Whistling Straits (Straits Course)', 'United States', 'Wisconsin', 'North America', 'A faux-links with staggering visuals, Open-calibre challenge, and thousands of bunkers.', 87, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Whistling Straits (Straits Course)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Aberdeen Golf Club (Balgownie)', 'United Kingdom', 'North East Scotland', 'Europe', 'Classic out-and-back links with a superb and testing front nine.', 88, 28, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Aberdeen Golf Club (Balgownie)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'St Andrews Beach Golf Club', 'Australia', 'Victoria', 'Oceania', 'Tom Doak''s first mainland Australian course — minimalist and memorable.', 89, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'St Andrews Beach Golf Club' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Cinque Ports Golf Club', 'United Kingdom', 'Kent', 'Europe', 'A relentless back nine and a storied Open Championship past.', 90, 29, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Cinque Ports Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Paraparaumu Beach Golf Club', 'New Zealand', 'North Island', 'Oceania', 'New Zealand''s spiritual home of championship golf, shaped by seaside elements.', 91, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Paraparaumu Beach Golf Club' AND country = 'New Zealand');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Te Arai Links (North)', 'New Zealand', 'North Island', 'Oceania', 'The newest Doak design to hit NZ''s coast — wide, wild, and world-class.', 92, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Te Arai Links (North)' AND country = 'New Zealand');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Prestwick Golf Club', 'United Kingdom', 'Ayrshire & Arran', 'Europe', 'The birthplace of The Open — quirk, charm, and history abound.', 93, 30, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Peachtree Golf Club', 'United States', 'Georgia', 'North America', 'Bobby Jones and Robert Trent Jones Sr.''s Atlanta legacy.', 94, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Peachtree Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Naruo Golf Club', 'Japan', 'Kinki', 'Asia', 'Old-school Japanese prestige with classically shaped fairways and subtle greens.', 95, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Naruo Golf Club' AND country = 'Japan');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Yas Links Golf Course', 'United Arab Emirates', 'United Arab Emirates', 'Asia', 'Flawless conditioning meets Arabian coastline drama.', 96, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Yas Links Golf Course' AND country = 'United Arab Emirates');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Te Arai Links (South)', 'New Zealand', 'North Island', 'Oceania', 'The first of two modern masterpieces in the Te Arai project.', 97, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Te Arai Links (South)' AND country = 'New Zealand');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cape Kidnappers Golf Course', 'New Zealand', 'North Island', 'Oceania', 'Jaw-dropping clifftop design where every hole feels on the edge of the earth.', 98, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cape Kidnappers Golf Course' AND country = 'New Zealand');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'PGA Golf Club An Ying - Yangtze Dunes', 'China', 'Yangtze River', 'Asia', 'Reclaimed land turned into a links-style challenge by OCCM.', 99, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'PGA Golf Club An Ying - Yangtze Dunes' AND country = 'China');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Real Club Valderrama', 'Spain', 'Southern Spain', 'Europe', 'Host of the 1997 Ryder Cup, Spain''s most famous golf course.', 100, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Real Club Valderrama' AND country = 'Spain');
