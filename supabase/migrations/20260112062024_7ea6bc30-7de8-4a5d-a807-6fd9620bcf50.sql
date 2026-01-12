-- Update photo URLs for Xander Schauffele, Tommy Fleetwood, and Russell Henley
UPDATE sr_players 
SET photo_url = '/player-headshots/xander-schauffele.png' 
WHERE id = '14f2f13d-ca25-4b48-b381-c28fb5897883';

UPDATE sr_players 
SET photo_url = '/player-headshots/tommy-fleetwood.png' 
WHERE id = 'aed4c8cf-df8c-4cc5-aae7-865e6bb7a41a';

UPDATE sr_players 
SET photo_url = '/player-headshots/russell-henley.png' 
WHERE id = '9086e1e7-3283-4c2a-8f9f-46b3e92db644';