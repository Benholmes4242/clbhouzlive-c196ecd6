
-- Update existing courses that are in both the Worldwide Top 100 and GB&I Top 100
-- These courses should keep their global_rank and get a regional_rank

UPDATE public.golf_courses 
SET regional_rank = 1, region = 'Down', updated_at = now()
WHERE name = 'Royal County Down Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 2, region = 'Fife', updated_at = now()
WHERE name = 'St Andrews Old Course' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 3, region = 'Antrim', updated_at = now()
WHERE name = 'Royal Portrush Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 4, region = 'Lothians', updated_at = now()
WHERE name = 'Muirfield' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 5, region = 'Ayrshire & Arran', updated_at = now()
WHERE name = 'Trump Turnberry (Ailsa)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 6, region = 'North Scotland', updated_at = now()
WHERE name = 'Royal Dornoch Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 7, region = 'Kent', updated_at = now()
WHERE name = 'Royal St George''s Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 8, region = 'Surrey', updated_at = now()
WHERE name = 'Sunningdale Golf Club (Old)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 9, region = 'Kerry', updated_at = now()
WHERE name = 'Ballybunion Golf Club (Old)' AND country = 'Ireland';

UPDATE public.golf_courses 
SET regional_rank = 10, region = 'Clare', updated_at = now()
WHERE name = 'Lahinch Golf Club (Old)' AND country = 'Ireland';

UPDATE public.golf_courses 
SET regional_rank = 11, region = 'Angus & Dundee', updated_at = now()
WHERE name = 'Carnoustie Golf Links' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 12, region = 'Donegal', updated_at = now()
WHERE name = 'Rosapenna Golf Club (St Patrick''s Links)' AND country = 'Ireland';

UPDATE public.golf_courses 
SET regional_rank = 13, region = 'Surrey', updated_at = now()
WHERE name = 'Sunningdale Golf Club (New)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 14, region = 'Lothians', updated_at = now()
WHERE name = 'North Berwick Golf Club (West Links)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 15, region = 'Fife', updated_at = now()
WHERE name = 'Kingsbarns Golf Links' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 16, region = 'Argyll & Bute', updated_at = now()
WHERE name = 'Ardfin' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 17, region = 'Cornwall', updated_at = now()
WHERE name = 'St Enodoc Golf Club (Church)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 18, region = 'Berkshire', updated_at = now()
WHERE name = 'Swinley Forest Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 19, region = 'North Scotland', updated_at = now()
WHERE name = 'Cabot Highlands (Castle Stuart)' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 20, region = 'Lancashire', updated_at = now()
WHERE name = 'Royal Lytham & St Annes Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 21, region = 'South Wales', updated_at = now()
WHERE name = 'Royal Porthcawl Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 22, region = 'North East Scotland', updated_at = now()
WHERE name = 'Cruden Bay Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 23, region = 'Yorkshire', updated_at = now()
WHERE name = 'Ganton Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 24, region = 'Dublin', updated_at = now()
WHERE name = 'Portmarnock Golf Club' AND country = 'Ireland';

UPDATE public.golf_courses 
SET regional_rank = 25, region = 'North East Scotland', updated_at = now()
WHERE name = 'Trump International Golf Links Scotland' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 26, region = 'Lancashire', updated_at = now()
WHERE name = 'Royal Birkdale Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 27, region = 'Surrey', updated_at = now()
WHERE name = 'St George''s Hill Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 28, region = 'North East Scotland', updated_at = now()
WHERE name = 'Royal Aberdeen Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 29, region = 'Kent', updated_at = now()
WHERE name = 'Royal Cinque Ports Golf Club' AND country = 'United Kingdom';

UPDATE public.golf_courses 
SET regional_rank = 30, region = 'Ayrshire & Arran', updated_at = now()
WHERE name = 'Prestwick Golf Club' AND country = 'United Kingdom';

-- Now insert the new courses that are only in the GB&I Top 100 (ranks 31-100)
INSERT INTO public.golf_courses (name, country, region, continent, regional_rank, description, thumbnail_image) VALUES
('West Sussex Golf Club', 'United Kingdom', 'Sussex', 'Europe', 31, 'Tucked into a sandy heath, this inland gem plays firm and fast with undeniable charm.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Rye Golf Club', 'United Kingdom', 'Sussex', 'Europe', 32, 'One of Britain''s toughest challenges, this course demands precision and celebrates golden-age design.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Woodhall Spa Golf Club', 'United Kingdom', 'Lincolnshire', 'Europe', 33, 'With towering trees and natural contours, this secluded haven is a delight to both walk and play.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal Troon Golf Club', 'United Kingdom', 'Ayrshire & Arran', 'Europe', 34, 'Beloved by traditionalists, this course is known for its unforgettable short holes and clever routing.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal West Norfolk Golf Club', 'United Kingdom', 'Norfolk', 'Europe', 35, 'Cut off by high tides, this isolated links has a wild, untamed character you won''t soon forget.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Walton Heath Golf Club', 'United Kingdom', 'Surrey', 'Europe', 36, 'Although landlocked, this inland track has the soul and rhythm of a true seaside links.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Machrihanish Golf Club', 'United Kingdom', 'Argyll & Bute', 'Europe', 37, 'Short and sweet, this scenic spot offers quirky charm and strategic thrills in equal measure.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal Liverpool Golf Club', 'United Kingdom', 'Cheshire', 'Europe', 38, 'Exposed to strong coastal winds, this no-frills links demands creativity and control.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Gleneagles (King''s)', 'United Kingdom', 'Perth & Kinross', 'Europe', 39, 'Framed by rolling hills, this majestic layout boasts grandeur, challenge, and spectacular views.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Loch Lomond Golf Club', 'United Kingdom', 'Dunbartonshire', 'Europe', 40, 'With loch views and mountain backdrops, this secluded retreat exudes natural beauty and scale.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Alwoodley Golf Club', 'United Kingdom', 'Yorkshire', 'Europe', 41, 'Unassuming yet refined, this rural gem is known for its subtle design and whisper-quiet surroundings.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('European Club', 'Ireland', 'Wicklow', 'Europe', 42, 'Located on a rugged Irish coastline, this flowing layout serves up postcard views and classic links traits.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Western Gailes Golf Club', 'United Kingdom', 'Ayrshire & Arran', 'Europe', 43, 'Winding through heather and burns, this moody layout is big on character and variety.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Hollinwell', 'United Kingdom', 'Nottinghamshire', 'Europe', 44, 'Quiet and private, this sandy heathland design rewards patience and smart play.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Waterville Golf Links', 'Ireland', 'Kerry', 'Europe', 45, 'Clinging to the edge of land and sea, this coastal masterpiece offers relentless views and shot values.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Dumbarnie Links', 'United Kingdom', 'Fife', 'Europe', 46, 'Sweeping vistas and wide fairways define this modern build, laid atop a storied estate.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Silloth on Solway Golf Club', 'United Kingdom', 'Cumbria', 'Europe', 47, 'Off the beaten path, this course is rugged, wind-swept, and rich in authentic links texture.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('The Island Golf Club', 'Ireland', 'Dublin', 'Europe', 48, 'Rough around the edges in all the right ways, this rustic gem channels the game''s early roots.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('The Berkshire Golf Club (Red)', 'United Kingdom', 'Berkshire', 'Europe', 49, 'Lined with forests and full of bounce, this inland layout is pure joy in every season.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('County Louth Golf Club', 'Ireland', 'Louth', 'Europe', 50, 'With a road to the clubhouse nearly as memorable as the course itself, this links exudes charm.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Hillside Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 51, 'A lesser-known neighbour to a famed venue, this hidden gem punches well above its weight.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Formby Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 52, 'A pine-fringed blend of heath and linksland, perfect for golfers who love variety and texture.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Saunton Golf Club (East)', 'United Kingdom', 'Devon', 'Europe', 53, 'Championship-calibre and Open-ready, this firm, fast test is one of the country''s finest.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Nairn Golf Club', 'United Kingdom', 'North Scotland', 'Europe', 54, 'Few courses rival this one for seaside drama—every hole is a photo op waiting to happen.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Wentworth Club (West)', 'United Kingdom', 'Surrey', 'Europe', 55, 'The flagship of inland golf in its region, this is a bold, testing track full of character.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Hankley Common Golf Club', 'United Kingdom', 'Surrey', 'Europe', 56, 'Spacious, strategic, and wonderfully walkable, this inland design balances width with demand.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('County Sligo Golf Club', 'Ireland', 'Sligo', 'Europe', 57, 'Dramatically positioned above the sea, this is a stirring west-coast adventure from start to finish.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Trump International Golf Links - Ireland', 'Ireland', 'Clare', 'Europe', 58, 'Once crafted by a legend, now revitalised into a visual and tactical tour de force.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Another Place, The Machrie', 'United Kingdom', 'Argyll & Bute', 'Europe', 59, 'Rustic and untamed, this windblown outpost beside a boutique hotel offers golf at its purest.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Adare Manor Golf Club', 'Ireland', 'Limerick', 'Europe', 60, 'Luxurious and bold, this parkland stage is set to welcome a Ryder Cup in style.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Gullane Golf Club (No.1)', 'United Kingdom', 'Lothians', 'Europe', 61, 'Meticulously conditioned and scenic, this winter-friendly track is loved for its year-round appeal.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Burnham & Berrow Golf Club', 'United Kingdom', 'Somerset', 'Europe', 62, 'A historic tournament venue that continues to test elite players on every visit.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Carne Golf Links', 'Ireland', 'Mayo', 'Europe', 63, 'This massive dunescape feels like another world—raw, windswept, and unforgettable.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Ballyliffin Golf Club', 'Ireland', 'Donegal', 'Europe', 64, 'A northern outpost that impresses with its wild terrain and rolling dunes.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Rosapenna Golf Resort (Sandy Hills Links)', 'Ireland', 'Donegal', 'Europe', 65, 'Built on bold elevation and strategic design, this course is a thrilling journey from start to finish.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Woking Golf Club', 'United Kingdom', 'Surrey', 'Europe', 66, 'A charming heathland venue with character, quirk, and an unmistakable sense of history.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Tralee Golf Club', 'Ireland', 'Kerry', 'Europe', 67, 'Panoramic coastal views meet clever shot-making on this beautifully sculpted seaside layout.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Queenwood Golf Club', 'United Kingdom', 'Surrey', 'Europe', 68, 'Pristine and private, this refined destination oozes exclusivity and polish.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Hunstanton Golf Club', 'United Kingdom', 'Norfolk', 'Europe', 69, 'An under-the-radar coastal gem, full of charm and memorable holes by the sea.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Enniscrone Golf Club', 'Ireland', 'Sligo', 'Europe', 70, 'Carved through massive dunes, this epic course delivers drama, scale, and soul.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Liphook Golf Club', 'United Kingdom', 'Hampshire', 'Europe', 71, 'For fans of traditional golf, this classic heathland layout is an absolute treat.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Worplesdon Golf Club', 'United Kingdom', 'Surrey', 'Europe', 72, 'Refined, scenic, and always in perfect condition, this is the crown jewel of the Three Ws.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Skibo Castle - Carnegie Links', 'United Kingdom', 'North Scotland', 'Europe', 73, 'Luxurious and grand, this storybook layout brings together sweeping views and top-tier conditioning.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('The Renaissance Club', 'United Kingdom', 'Lothians', 'Europe', 74, 'Modern in vision but classic in execution, this is a contemporary masterpiece of golf architecture.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Old Head Golf Links', 'Ireland', 'Cork', 'Europe', 75, 'Jutting far into the sea, this dramatic clifftop venue offers one of the most thrilling experiences in the game.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Portstewart Golf Club', 'United Kingdom', 'Londonderry', 'Europe', 76, 'Rolling through vast dunes, this visually spectacular course is as fun as it is photogenic.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('West Hill Golf Club', 'United Kingdom', 'Surrey', 'Europe', 77, 'Short, compact, and full of life—this charming heathland course is packed with character.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Narin and Portnoo Links', 'Ireland', 'Donegal', 'Europe', 78, 'Wild, raw, and remote, this is pure links golf on nature''s terms.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Pennard Golf Club', 'United Kingdom', 'South Wales', 'Europe', 79, 'Set high above the coastline, this elevated course is both challenging and unforgettable.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Gleneagles (Queen''s)', 'United Kingdom', 'Perth & Kinross', 'Europe', 80, 'Though shorter in length, this royal companion to a bigger sibling is elegant and strategic.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal St David''s Golf Club', 'United Kingdom', 'North Wales', 'Europe', 81, 'Backed by a medieval castle and wrapped in towering dunes, this is one of Wales'' treasures.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Machrihanish Dunes', 'United Kingdom', 'Argyll & Bute', 'Europe', 82, 'Left as untouched as possible, this links is all about simplicity, rhythm, and beauty.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Parkstone Golf Club', 'United Kingdom', 'Dorset', 'Europe', 83, 'Seaside views meet inland pine with excellent elevation and variety across the routing.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('The Berkshire Golf Club (Blue)', 'United Kingdom', 'Berkshire', 'Europe', 84, 'Winding through woodlands, this shorter sibling to a championship course has its own flair.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Aberdovey Golf Club', 'United Kingdom', 'North Wales', 'Europe', 85, 'Simple, natural, and pure, this coastal links captures everything beautiful about the game.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('West Lancashire Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 86, 'Flanked by bigger names, this lesser-known layout is just as deserving of top billing.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Prince''s Golf Club', 'United Kingdom', 'Kent', 'Europe', 87, 'With deep Open Championship roots, this links is rich in heritage and rolling contours.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('The Addington Golf Club', 'United Kingdom', 'Surrey', 'Europe', 88, 'An inland retreat full of springy turf and blooming heath, as charming as it is playable.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Broadstone Golf Club', 'United Kingdom', 'Dorset', 'Europe', 89, 'This countryside escape offers hilly drama and endless views over the landscape.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('JCB Golf & Country Club', 'United Kingdom', 'Staffordshire', 'Europe', 90, 'A bold and futuristic build, this mega-modern layout is unlike anything else in the UK.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Hindhead Golf Club', 'United Kingdom', 'Surrey', 'Europe', 91, 'With rugged elevation and a tale of two terrains, this course brings the Ice Age to life.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Walton Heath Golf Club (New)', 'United Kingdom', 'Surrey', 'Europe', 92, 'Set beside its storied sibling, this inland design is tough, narrow, and endlessly engaging.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Castletown Golf Links', 'Isle of Man', 'Isle of Man', 'Europe', 93, 'Nearly surrounded by ocean, this headland course brings visual drama to every hole.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Delamere Forest Golf Club', 'United Kingdom', 'Cheshire', 'Europe', 94, 'A golden-age gem that flows beautifully through undulating heathland terrain.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Southport & Ainsdale Golf Club', 'United Kingdom', 'Lancashire', 'Europe', 95, 'Younger in age but mature in challenge, this course brings serious links pedigree.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Moortown Golf Club', 'United Kingdom', 'Yorkshire', 'Europe', 96, 'Soft underfoot but hard to score on, this moorland design is rich in charm and character.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Wallasey Golf Club', 'United Kingdom', 'Cheshire', 'Europe', 97, 'Unpolished, windswept, and full of quirks, this links remains true to the game''s roots.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal Dublin Golf Club', 'Ireland', 'Dublin', 'Europe', 98, 'Routing through shifting sands, this layout is perfectly suited to its island setting.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Brora Golf Club', 'United Kingdom', 'North Scotland', 'Europe', 99, 'With weathered dunes and Highland air, this rustic links offers timeless simplicity.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('St Andrews Links (New)', 'United Kingdom', 'Fife', 'Europe', 100, 'Often overlooked, this tighter local''s favourite is a pure golfing test from start to finish.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop');
