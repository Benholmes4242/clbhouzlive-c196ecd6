
-- Insert golf courses ranked 31-60 in GB&I Top 100
-- Using individual INSERT statements to avoid conflicts
INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'West Sussex Golf Club', 'United Kingdom', 'Sussex', 'Europe', 'West Sussex Golf Club is one of our favourite inland courses. It is sheer delight to play golf on this charming sandy outcrop of heathland.', NULL, 31, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'West Sussex Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Rye Golf Club (Old)', 'United Kingdom', 'Sussex', 'Europe', 'Rye Golf Club was founded in 1894 and was the inaugural design of 25-year-old Harry Colt. It''s one of the toughest courses in Britain.', NULL, 32, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Rye Golf Club (Old)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Woodhall Spa Golf Club (Hotchkin)', 'United Kingdom', 'Lincolnshire', 'Europe', 'An oasis in the heart of Lincolnshire, this heathland course is a joy to play, set among glorious pine, birch and broom.', NULL, 33, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Woodhall Spa Golf Club (Hotchkin)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Troon Golf Club (Old)', 'United Kingdom', 'Ayrshire & Arran', 'Europe', 'A traditional out-and-back links course on the Open Rota, best known for the short par-3 Postage Stamp and strategic Railway hole.', NULL, 34, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Troon Golf Club (Old)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal West Norfolk Golf Club', 'United Kingdom', 'Norfolk', 'Europe', 'Located on a narrow strip of land, it becomes an island at high tide. A uniquely remote and natural golf experience.', NULL, 35, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal West Norfolk Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Walton Heath Golf Club (Old)', 'United Kingdom', 'Surrey', 'Europe', 'Where inland golf feels like links — a classic course without the sea breeze, but full of challenge and charm.', NULL, 36, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Walton Heath Golf Club (Old)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Machrihanish Golf Club (Championship)', 'United Kingdom', 'Argyll & Bute', 'Europe', 'A romantic and natural layout on Scotland''s west coast. Short in length but rich in charm and fun.', NULL, 37, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Machrihanish Golf Club (Championship)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Liverpool Golf Club', 'United Kingdom', 'Cheshire', 'Europe', 'A challenging links exposed to Hoylake''s winds, with only a few holes nestled in dunes.', NULL, 38, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Liverpool Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Gleneagles (King''s)', 'United Kingdom', 'Perth & Kinross', 'Europe', 'Possibly the best moorland course in the world, Gleneagles King''s offers breathtaking scenery and championship conditions.', NULL, 39, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Gleneagles (King''s)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Loch Lomond Golf Club', 'United Kingdom', 'Dunbartonshire', 'Europe', 'Nestled between mountain and loch, Loch Lomond is secluded and stunning, with over 600 acres of majestic landscape.', NULL, 40, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Loch Lomond Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Alwoodley Golf Club', 'United Kingdom', 'Yorkshire', 'Europe', 'One of Britain''s finest and most subtle inland courses, located in a peaceful Yorkshire setting.', NULL, 41, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Alwoodley Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'European Club', 'Ireland', 'Wicklow', 'Europe', 'Located between Wicklow and Arklow, this stunning Irish links sits on Ireland''s scenic east coast.', NULL, 42, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'European Club' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Western Gailes Golf Club', 'United Kingdom', 'Ayrshire & Arran', 'Europe', 'A varied, undulating links course interrupted by meandering burns and rich in character.', NULL, 43, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Western Gailes Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Hollinwell', 'United Kingdom', 'Nottinghamshire', 'Europe', 'Known as Notts Golf Club, this course is a secluded, high-quality heathland layout with a loyal following.', NULL, 44, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Hollinwell' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Waterville Golf Links', 'Ireland', 'Kerry', 'Europe', 'A remote, oceanfront links set on a spectacular promontory. Beautiful and challenging.', NULL, 45, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Waterville Golf Links' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Dumbarnie Links', 'United Kingdom', 'Fife', 'Europe', 'A modern Clive Clark design with sweeping sea views, built on a historic Scottish estate.', NULL, 46, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Dumbarnie Links' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Silloth on Solway Golf Club', 'United Kingdom', 'Cumbria', 'Europe', 'A remote and rewarding destination, full of rugged links character and charm.', NULL, 47, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Silloth on Solway Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'The Island', 'Ireland', 'Dublin', 'Europe', 'A natural, unmanicured links in tune with its surroundings — raw and authentic.', NULL, 48, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Island' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'The Berkshire Golf Club (Red)', 'United Kingdom', 'Berkshire', 'Europe', 'Forest, heather, and springy turf combine on this highly regarded inland course.', NULL, 49, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Berkshire Golf Club (Red)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'County Louth Golf Club', 'Ireland', 'Louth', 'Europe', 'Known locally as Baltray, this course welcomes you with its uplifting coastal approach road.', NULL, 50, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'County Louth Golf Club' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Hillside Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 'An underrated gem near Royal Birkdale, divided only by a footpath but full of character.', NULL, 51, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Hillside Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Formby Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 'A scenic blend of links and heathland, bordered on three sides by pine trees.', NULL, 52, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Formby Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Saunton Golf Club (East)', 'United Kingdom', 'Devon', 'Europe', 'A potential future Open venue, this is a championship links of the highest standard.', NULL, 53, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Saunton Golf Club (East)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Nairn Golf Club (Championship)', 'United Kingdom', 'North Scotland', 'Europe', 'A seaside course with views from every hole — one of Scotland''s most beautiful links.', NULL, 54, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Nairn Golf Club (Championship)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Wentworth Club (West)', 'United Kingdom', 'Surrey', 'Europe', 'Home of the BMW PGA, Wentworth''s West course is Surrey''s best-known inland course.', NULL, 55, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Wentworth Club (West)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Hankley Common Golf Club', 'United Kingdom', 'Surrey', 'Europe', 'A spacious heathland course with room to breathe and classic inland design.', NULL, 56, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Hankley Common Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'County Sligo Golf Club (Championship)', 'Ireland', 'Sligo', 'Europe', 'Also known as Rosses Point, it''s a stirring links on the dramatic Irish west coast.', NULL, 57, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'County Sligo Golf Club (Championship)' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Trump International Golf Links - Ireland', 'Ireland', 'Clare', 'Europe', 'Once a Greg Norman creation, now redesigned by Martin Hawtree, and stunningly situated.', NULL, 58, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Trump International Golf Links - Ireland' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Another Place, The Machrie', 'United Kingdom', 'Argyll & Bute', 'Europe', 'Recently refurbished, this rugged links lies beside a boutique hotel on Islay.', NULL, 59, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Another Place, The Machrie' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Adare Manor Golf Club', 'Ireland', 'Limerick', 'Europe', 'A lavish parkland layout redesigned by Tom Fazio and home to the 2027 Ryder Cup.', NULL, 60, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Adare Manor Golf Club' AND country = 'Ireland');
