-- Update photo URLs for Scottie Scheffler and Rory McIlroy
UPDATE sr_players 
SET photo_url = '/player-headshots/scottie-scheffler.png' 
WHERE id = '9a9b484c-8026-40b8-ab4b-e9fa95464231';

UPDATE sr_players 
SET photo_url = '/player-headshots/rory-mcilroy.png' 
WHERE id = '300bff22-d7aa-4370-a69d-cb008f0dbc4f';