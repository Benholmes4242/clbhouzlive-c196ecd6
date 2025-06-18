
-- Insert golf courses ranked 31-60 in the world
INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Crystal Downs Country Club', 'United States', 'Michigan', 'North America', 'A MacKenzie and Maxwell collaboration nestled between Lake Michigan and Crystal Lake.', 31, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Crystal Downs Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Lahinch Golf Club (Old)', 'Ireland', 'Clare', 'Europe', 'Rugged, varied, and wildly entertaining — Ireland''s original links masterpiece.', 32, 10, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Lahinch Golf Club (Old)' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Winged Foot Golf Club (West)', 'United States', 'New York', 'North America', 'Tillinghast''s crown jewel with a fearsome reputation in major championship golf.', 33, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Winged Foot Golf Club (West)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Carnoustie Golf Links (Championship)', 'United Kingdom', 'Angus & Dundee', 'Europe', 'One of the toughest tests in links golf, steeped in Open history.', 34, 11, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Carnoustie Golf Links (Championship)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Shanqin Bay Golf Club', 'China', 'Coastal Region', 'Asia', 'Built into dramatic coastal cliffs — a benchmark for golf in Asia.', 35, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Shanqin Bay Golf Club' AND country = 'China');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'California Golf Club of San Francisco', 'United States', 'California', 'North America', 'A revitalised classic with slick greens and championship length.', 36, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'California Golf Club of San Francisco' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Rosapenna Golf Resort - St Patrick''s Links', 'Ireland', 'Donegal', 'Europe', 'Tom Doak''s bold, modern layout built over soaring dunes in northwest Ireland.', 37, 12, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Rosapenna Golf Resort - St Patrick''s Links' AND country = 'Ireland');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Old Town Club', 'United States', 'North Carolina', 'North America', 'Maxwell''s clever greens and strategic brilliance define this hidden gem.', 38, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Old Town Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'San Francisco Golf Club', 'United States', 'California', 'North America', 'Historic and private — a Tillinghast treasure from 1915.', 39, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'San Francisco Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Somerset Hills Country Club', 'United States', 'New Jersey', 'North America', 'Jekyll and Hyde layout mixing links-style front with wooded back nine.', 40, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Somerset Hills Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Sunningdale Golf Club (New)', 'United Kingdom', 'Surrey', 'Europe', 'Together with the Old, forms Britain''s finest 36-hole inland golf destination.', 41, 13, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sunningdale Golf Club (New)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'North Berwick Golf Club (West Links)', 'United Kingdom', 'Lothians', 'Europe', 'Wild, quirky, and beautiful — the original inspiration for template holes.', 42, 14, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'North Berwick Golf Club (West Links)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Kingsbarns Golf Links', 'United Kingdom', 'Fife', 'Europe', 'Modern links perfection with panoramic sea views on every hole.', 43, 15, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Kingsbarns Golf Links' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Ardfin', 'United Kingdom', 'Argyll & Bute', 'Europe', 'Remote and rugged, draped across Jura''s dramatic coastline.', 44, 16, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ardfin' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Morfontaine Golf Club (Grand Parcours)', 'France', 'North East France', 'Europe', 'Simpson''s timeless artistry lives on in this elegant forest course.', 45, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Morfontaine Golf Club (Grand Parcours)' AND country = 'France');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Oakland Hills Country Club (South)', 'United States', 'Michigan', 'North America', 'A six-time U.S. Open host, recently restored to its golden age glory.', 46, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Oakland Hills Country Club (South)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cape Wickham Golf Links', 'Australia', 'Tasmania', 'Oceania', 'Crashing waves, bold holes, and isolation combine in this modern great.', 47, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cape Wickham Golf Links' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Camargo Club', 'United States', 'Ohio', 'North America', 'Raynor''s strategic routing dances over Cincinnati''s rolling terrain.', 48, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Camargo Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'St Enodoc Golf Club (Church)', 'United Kingdom', 'Cornwall', 'Europe', 'A hilly, eccentric links steeped in Cornish charm and history.', 49, 17, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'St Enodoc Golf Club (Church)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Santapazienza Golf Club', 'Brazil', 'São Paulo', 'South America', 'Tom Fazio''s South American showpiece, lush and secluded.', 50, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Santapazienza Golf Club' AND country = 'Brazil');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Shoreacres', 'United States', 'Illinois', 'North America', 'Subtle, strategic Raynor design tucked into the North Shore of Chicago.', 51, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Shoreacres' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Swinley Forest Golf Club', 'United Kingdom', 'Berkshire', 'Europe', 'Timeless, private, and eccentric — a heathland classic frozen in time.', 52, 18, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Swinley Forest Golf Club' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'CapRock Ranch', 'United States', 'Nebraska', 'North America', 'A new American icon carved into the sand hills by Coore & Crenshaw.', 53, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'CapRock Ranch' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cabot Highlands (Castle Stuart)', 'United Kingdom', 'North Scotland', 'Europe', 'Dramatic elevation changes and world-class architecture in the Highlands.', 54, 19, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cabot Highlands (Castle Stuart)' AND country = 'United Kingdom');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Seminole Golf Club', 'United States', 'Florida', 'North America', 'Donald Ross masterpiece revered for its routing and elite membership.', 55, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Seminole Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Utrecht de Pan (Utrechtse Golfclub)', 'Netherlands', 'Utrecht', 'Europe', 'Elegant Dutch classic known for subtle design and exacting strategy.', 56, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Utrecht de Pan (Utrechtse Golfclub)' AND country = 'Netherlands');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Pinehurst No. 2', 'United States', 'North Carolina', 'North America', 'Ross''s masterpiece — slick turtleback greens demand precision and imagination.', 57, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pinehurst No. 2' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Bethpage Black', 'United States', 'New York', 'North America', 'A brutal, public-access monster — "warning: extremely difficult course."', 58, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bethpage Black' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Oak Hill Country Club (East)', 'United States', 'New York', 'North America', 'Restored Ross design, host to countless majors and major champions.', 59, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Oak Hill Country Club (East)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'The Lido (Sand Valley)', 'United States', 'Wisconsin', 'North America', 'A painstaking resurrection of Macdonald''s legendary Long Island layout.', 60, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Lido (Sand Valley)' AND country = 'United States');
