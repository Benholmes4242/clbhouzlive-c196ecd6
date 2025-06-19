
-- Add a usa_rank column to store USA-specific rankings
ALTER TABLE public.golf_courses ADD COLUMN IF NOT EXISTS usa_rank integer;

-- Update existing courses that appear in both the Worldwide Top 100 and USA Top 100
UPDATE public.golf_courses 
SET usa_rank = 1, updated_at = now()
WHERE name = 'Cypress Point Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 2, updated_at = now()
WHERE name = 'Pine Valley Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 3, updated_at = now()
WHERE name = 'Shinnecock Hills Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 4, updated_at = now()
WHERE name = 'National Golf Links of America' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 5, updated_at = now()
WHERE name = 'Oakmont Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 6, updated_at = now()
WHERE name = 'Sand Hills Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 7, updated_at = now()
WHERE name = 'Merion Golf Club (East)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 8, updated_at = now()
WHERE name = 'Augusta National Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 9, updated_at = now()
WHERE name = 'Los Angeles Country Club (North)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 10, updated_at = now()
WHERE name = 'Fishers Island Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 11, updated_at = now()
WHERE name = 'Friar''s Head' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 12, updated_at = now()
WHERE name = 'Chicago Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 13, updated_at = now()
WHERE name = 'Bandon Dunes (Pacific Dunes)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 14, updated_at = now()
WHERE name = 'Pebble Beach Golf Links' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 15, updated_at = now()
WHERE name = 'Prairie Dunes Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 16, updated_at = now()
WHERE name = 'Riviera Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 17, updated_at = now()
WHERE name = 'Crystal Downs Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 18, updated_at = now()
WHERE name = 'Winged Foot Golf Club (West)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 19, updated_at = now()
WHERE name = 'California Golf Club of San Francisco' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 20, updated_at = now()
WHERE name = 'Old Town Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 21, updated_at = now()
WHERE name = 'San Francisco Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 22, updated_at = now()
WHERE name = 'Somerset Hills Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 23, updated_at = now()
WHERE name = 'Oakland Hills Country Club (South)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 24, updated_at = now()
WHERE name = 'Camargo Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 25, updated_at = now()
WHERE name = 'Shoreacres' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 26, updated_at = now()
WHERE name = 'CapRock Ranch' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 27, updated_at = now()
WHERE name = 'Seminole Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 28, updated_at = now()
WHERE name = 'Bethpage Black' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 29, updated_at = now()
WHERE name = 'Pinehurst No. 2' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 30, updated_at = now()
WHERE name = 'Oak Hill Country Club (East)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 31, updated_at = now()
WHERE name = 'The Lido (Sand Valley)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 32, updated_at = now()
WHERE name = 'Maidstone Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 33, updated_at = now()
WHERE name = 'Sleepy Hollow Country Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 34, updated_at = now()
WHERE name = 'Myopia Hunt Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 35, updated_at = now()
WHERE name = 'Eastward Ho!' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 36, updated_at = now()
WHERE name = 'Garden City Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 37, updated_at = now()
WHERE name = 'Ballyneal Golf Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 38, updated_at = now()
WHERE name = 'Bandon Trails' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 39, updated_at = now()
WHERE name = 'Bandon Dunes' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 40, updated_at = now()
WHERE name = 'Inverness Club' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 41, updated_at = now()
WHERE name = 'Rock Creek Cattle Company' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 42, updated_at = now()
WHERE name = 'Whistling Straits (Straits Course)' AND country = 'United States';

UPDATE public.golf_courses 
SET usa_rank = 43, updated_at = now()
WHERE name = 'Peachtree Golf Club' AND country = 'United States';

-- Insert new courses that are only in the USA Top 100 (ranks 44-100)
INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Baltusrol Golf Club (Lower)', 'United States', 'New Jersey', 'North America', 44, 'Baltusrol Golf Club''s roots run deep, its name linked to Baltus Roll, the original landowner. The club''s historic significance is matched by the quality of its courses.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Baltusrol Golf Club (Lower)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Kiawah Island Golf Resort (Ocean)', 'United States', 'South Carolina', 'North America', 45, 'Pete Dye''s Ocean Course at Kiawah Island is ferocious and breathtaking. With more seaside holes than any course in the Northern Hemisphere, it''s a bucket-list experience.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Kiawah Island Golf Resort (Ocean)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Country Club (Clyde & Squirrel)', 'United States', 'Massachusetts', 'North America', 46, 'The Country Club at Brookline may sound unassuming, but it was the first of its kind in the US. Its 27-hole layout, unified by Gil Hanse, remains truly iconic.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Country Club (Clyde & Squirrel)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Old Barnwell', 'United States', 'South Carolina', 'North America', 47, 'Old Barnwell redefines private golf. Modern yet steeped in ethos, this South Carolina layout does things differently—with thoughtful routing and a mission-driven club culture.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Old Barnwell' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Old Sandwich Golf Club', 'United States', 'Massachusetts', 'North America', 48, 'Old Sandwich''s green complexes are a true highlight—subtle contours and stunning bunker work by Jeff Bradley make this one of New England''s hidden masterpieces.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Old Sandwich Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Essex County Club', 'United States', 'Massachusetts', 'North America', 49, 'Essex County Club''s par-5 3rd hole is a beast—nearly as long as the previous two combined, it proves that strategy and shape are as important as sheer distance.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Essex County Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Winged Foot Golf Club (East)', 'United States', 'New York', 'North America', 50, 'Winged Foot''s East Course is another A.W. Tillinghast classic. Strategic, timeless and brutally elegant—it''s every bit the equal of its famous West sibling.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Winged Foot Golf Club (East)' AND country = 'United States');

-- Continue with the rest of the USA-only courses (51-100)
INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Yeamans Hall Club', 'United States', 'South Carolina', 'North America', 51, 'Yeamans Hall Club, crafted by Seth Raynor in 1925, remains one of South Carolina''s most admired courses. Stepping onto its grounds feels like entering a time capsule.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Yeamans Hall Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Wade Hampton Golf Club', 'United States', 'North Carolina', 'North America', 52, 'Wade Hampton Golf Club, named after a 19th-century general, is now best known for its stunning mountain golf and masterful design—pure Carolina perfection.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Wade Hampton Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Southern Hills Country Club (Championship)', 'United States', 'Oklahoma', 'North America', 53, 'Southern Hills exudes tradition. Gil Hanse''s updates have only enhanced its tough, tree-lined aesthetic and famously punishing Bermuda rough.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Southern Hills Country Club (Championship)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Ohoopee Match Club', 'United States', 'Georgia', 'North America', 54, 'Ohoopee Match Club is minimalist magic. Set in rural Georgia on a former onion farm, its match-play focus and intimate scale make it wholly unique.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ohoopee Match Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Golf Club', 'United States', 'Ohio', 'North America', 55, 'Pete Dye''s early work at The Golf Club in New Albany, Ohio, reveals his genius in restraint. A mature layout with charm and challenge in equal measure.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Quaker Ridge Golf Club', 'United States', 'New York', 'North America', 56, 'Quaker Ridge Golf Club may fly under the radar, but insiders know it''s one of the best-kept secrets in American golf—superb routing and conditioning.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Quaker Ridge Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Piping Rock Club', 'United States', 'New York', 'North America', 57, 'Piping Rock, designed by C.B. Macdonald in 1911, competes with polo for attention on Long Island—but holds its own with an all-world set of template holes.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Piping Rock Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Gozzer Ranch Golf & Lake Club', 'United States', 'Idaho', 'North America', 58, 'Gozzer Ranch''s setting is jaw-dropping. Perched above Lake Coeur d''Alene, it combines drama, elevation, and lakeside beauty into one unforgettable package.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Gozzer Ranch Golf & Lake Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Shadow Creek', 'United States', 'Nevada', 'North America', 59, 'Shadow Creek is pure Las Vegas spectacle—Tom Fazio sculpted it from desert floor to create a lush, surreal golf oasis that''s now open to all.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Shadow Creek' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Scioto Country Club', 'United States', 'Ohio', 'North America', 60, 'Scioto Country Club is where Jack Nicklaus grew up and learned the game—a historic, revered place with a proud legacy and strong Midwestern spirit.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Scioto Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Muirfield Village Golf Club', 'United States', 'Ohio', 'North America', 61, 'No expense was spared at Muirfield Village, and it shows. Jack Nicklaus''s vision includes water, tight fairways, and tournament-level conditioning throughout.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Muirfield Village Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Plainfield Country Club', 'United States', 'New Jersey', 'North America', 62, 'Plainfield Country Club is far from plain. Donald Ross''s masterwork in New Jersey surprises many with its bold greens and thrilling, hilly terrain.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Plainfield Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Pasatiempo Golf Club', 'United States', 'California', 'North America', 63, 'Pasatiempo is vintage MacKenzie. Built in 1929, it''s got quirky charm, bold design, and a historic foursomes match to its name.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pasatiempo Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'White Bear Yacht Club', 'United States', 'Minnesota', 'North America', 64, 'White Bear Yacht Club tests your balance more than your distance. With almost no level lies, it''s a fascinating challenge requiring total control.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'White Bear Yacht Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Monterey Peninsula Country Club (Dunes)', 'United States', 'California', 'North America', 65, 'The Dunes Course at Monterey Peninsula Country Club combines Raynor roots with MacKenzie tweaks and a modern Fazio revamp—history and progress in one.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Monterey Peninsula Country Club (Dunes)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'TPC Sawgrass (Stadium)', 'United States', 'Florida', 'North America', 66, 'TPC Sawgrass Stadium Course needs no introduction. The island green 17th has captured imaginations and shattered scorecards since 1980.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'TPC Sawgrass (Stadium)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Valley Club of Montecito', 'United States', 'California', 'North America', 67, 'The Valley Club of Montecito is modest by MacKenzie standards, but its elegance and pace of play make it one of the West Coast''s most charming rounds.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Valley Club of Montecito' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Kittansett Club', 'United States', 'Massachusetts', 'North America', 68, 'The Kittansett Club''s windswept location on Buzzards Bay ensures every shot counts. Great design meets Mother Nature on this coastal New England gem.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Kittansett Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Boston Golf Club', 'United States', 'Massachusetts', 'North America', 69, 'Boston Golf Club is routed across prime Massachusetts land. Brian Silva''s design is rugged, smart, and perfectly suited to private, pure golf.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Boston Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Baltimore Country Club (East)', 'United States', 'Maryland', 'North America', 70, 'Baltimore CC''s East Course, designed by A.W. Tillinghast in 1926, holds true to classic architecture—historic, tough, and wonderfully tree-lined.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Baltimore Country Club (East)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Milwaukee Country Club', 'United States', 'Wisconsin', 'North America', 71, 'Milwaukee Country Club is Wisconsin golf royalty. With origins dating to 1890, today''s course by Charles Hugh Alison remains a stern and scenic test.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Milwaukee Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Lawsonia (Links)', 'United States', 'Wisconsin', 'North America', 72, 'Lawsonia Links, built in 1930, is a Langford gem—bold shaping, clever bunkering, and a golden-age feel that punches well above its price tag.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Lawsonia (Links)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Olympic Club (Lake)', 'United States', 'California', 'North America', 73, 'The Lake Course at Olympic Club is a major test. With a relentless slope and narrow fairways, it''s hosted four US Opens and deserves every one.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Olympic Club (Lake)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Nanea', 'United States', 'Hawaii', 'North America', 74, 'Nanea Golf Club in Hawaii is ultra-private and volcano-born. British links principles meet lava rock for a one-of-a-kind golfing experience.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Nanea' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Sand Valley Golf Resort (Sand Valley)', 'United States', 'Wisconsin', 'North America', 75, 'Sand Valley is Keiser''s inland marvel. Set on ancient dunes in Wisconsin, it feels oceanside even without the sea—sand, width, and wind in spades.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sand Valley Golf Resort (Sand Valley)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Victoria National Golf Club', 'United States', 'Indiana', 'North America', 76, 'Carved from a reclaimed coal mine, Victoria National emerged in 1997 as a vision realised by Tom Fazio and founder Terry Friedman. It''s now one of Indiana''s standout layouts—bold, dramatic, and beautifully reimagined.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Victoria National Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Congaree Golf Club', 'United States', 'South Carolina', 'North America', 77, 'A club unlike any other, Congaree combines elite course architecture with a purpose-driven mission. Built by two experienced private club owners, this South Carolina gem is philanthropic golf at its finest.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Congaree Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Creek', 'United States', 'New York', 'North America', 78, 'Designed by the legendary duo Charles Blair Macdonald and Seth Raynor, The Creek is a masterclass in early American course design, blending strategic brilliance with elegant shaping.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Creek' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Calusa Pines Golf Club', 'United States', 'Florida', 'North America', 79, 'Calusa Pines is bold by design—quite literally. Tons of rock were removed to give this Naples, Florida course its rare elevation changes and thrilling visual drama.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Calusa Pines Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'St Louis Country Club', 'United States', 'Missouri', 'North America', 80, 'Nestled just outside the city, Saint Louis Country Club dates back to 1914 and uses its compact site creatively, showcasing the architectural subtleties of its golden-era roots.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'St Louis Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Ridgewood Country Club (East & West)', 'United States', 'New Jersey', 'North America', 81, 'Featuring three nine-hole loops—West, East, and Center—this club in New Jersey offers versatility and charm. The Clifford Wendehack-designed clubhouse adds historic appeal to a timeless layout.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ridgewood Country Club (East & West)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Bel-Air Country Club', 'United States', 'California', 'North America', 82, 'This George C. Thomas classic channels the glamour of the 1920s with routing that weaves through canyons and ridges. Tom Doak has called it one of the most extraordinary routings ever created.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bel-Air Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Ladera Golf Club', 'United States', 'California', 'North America', 83, 'A minimalist contrast to nearby desert developments, this exclusive design by Gil Hanse and Jim Wagner delivers a natural, understated experience amid Palm Springs'' sculpted excess.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Ladera Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Honors Course', 'United States', 'Tennessee', 'North America', 84, 'Hidden in a lush valley north of Chattanooga, The Honors Course is a true Southern treasure—quietly exceptional and consistently ranked among the country''s best.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Honors Course' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Colorado Golf Club', 'United States', 'Colorado', 'North America', 85, 'Opened in 2007, this Bill Coore and Ben Crenshaw design respects the game''s roots while embracing Colorado''s rolling terrain. It''s already considered a modern American classic.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Colorado Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Kingsley Club', 'United States', 'Michigan', 'North America', 86, 'Set in sandy Michigan terrain, Kingsley delivers a links-style feel far from the coast. Since opening in 2001, it has quietly built a cult following among design purists.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Kingsley Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Pikewood National Golf Club', 'United States', 'West Virginia', 'North America', 87, 'Built over years with no compromise, Pikewood is a true test of endurance and precision, winding through forested mountains on a challenging limestone landscape.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pikewood National Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'The Tree Farm', 'United States', 'South Carolina', 'North America', 88, 'Born from Zac Blair''s passion for golf architecture, The Tree Farm is a modern community-focused club, designed as a place where golf lovers gather, play, and enjoy great design.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'The Tree Farm' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Lake Merced Golf Club', 'United States', 'California', 'North America', 89, 'This San Francisco-area course has been reshaped through the decades by MacKenzie, Graves, and Rees Jones—resulting in a course with deep architectural pedigree.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Lake Merced Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Old Elm Club', 'United States', 'Illinois', 'North America', 90, 'A collaboration between Harry Colt and Donald Ross, Old Elm is a rare blend of two great minds. Laid out in 1913, it remains a model of subtlety and traditional elegance.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Old Elm Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Congressional Country Club (Blue)', 'United States', 'Maryland', 'North America', 91, 'Opened in 1924, this club near Washington, D.C. began with a straightforward layout by Devereux Emmet but evolved into one of America''s most recognisable tournament venues.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Congressional Country Club (Blue)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Scottsdale National Golf Club (The Other Course)', 'United States', 'Arizona', 'North America', 92, 'Jackson and Khan''s 15-month effort resulted in something boldly different. With unique features and views, this course challenges conventions in the Arizona desert.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Scottsdale National Golf Club (The Other Course)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Moraine Country Club', 'United States', 'Ohio', 'North America', 93, 'Originally laid out by Alec "Nipper" Campbell in 1930, Moraine was revitalised in 2015 by Keith Foster, restoring the rolling, golden-age design that makes it so special.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Moraine Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Lost Rail Golf Club', 'United States', 'Nebraska', 'North America', 94, 'Scott Hoffman and his cousin teamed up with Landscapes Unlimited to create Nebraska''s next big golf destination—designed to blend top-tier construction with Midwestern soul.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Lost Rail Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Streamsong Red', 'United States', 'Florida', 'North America', 95, 'Of all the holes at Streamsong, the Red''s short par-4 9th may be the most revered—especially by Tom Doak, who considers it one of his personal favourites.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Streamsong Red' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Chambers Bay', 'United States', 'Washington', 'North America', 96, 'Opened in 2007, this Washington layout has already hosted a U.S. Open and continues to rise in esteem. Built on a reclaimed gravel mine, it''s rugged and visually striking.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Chambers Bay' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Fox Chapel Golf Club', 'United States', 'Pennsylvania', 'North America', 97, 'A hidden gem in Pittsburgh, Fox Chapel is one of Seth Raynor''s most underappreciated works—a course full of bold strategy and template hole precision.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Fox Chapel Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Sand Valley (Sedge Valley)', 'United States', 'Wisconsin', 'North America', 98, 'Tom Doak''s Sedge Valley pays homage to the heathlands of England. Shorter than its resort siblings, it''s full of charm, character, and creative shotmaking.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sand Valley (Sedge Valley)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Medinah Country Club (No.3)', 'United States', 'Illinois', 'North America', 99, 'A Chicago institution since the 1920s, Medinah was born from a dream to be the finest club in the country. With multiple courses, it remains a pillar of American golf.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Medinah Country Club (No.3)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image)
SELECT 'Bandon Dunes Golf Resort (Old Macdonald)', 'United States', 'Oregon', 'North America', 100, 'Inspired by Charles Blair Macdonald''s design principles, Old Macdonald is the fourth course at Bandon Dunes—and a bold, open tribute to early American golf ideals.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bandon Dunes Golf Resort (Old Macdonald)' AND country = 'United States');
