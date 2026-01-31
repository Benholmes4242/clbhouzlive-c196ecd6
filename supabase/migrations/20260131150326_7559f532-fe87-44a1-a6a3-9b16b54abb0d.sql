-- Update Gordon Sargent's photo_url to use the app's public folder
UPDATE sr_players
SET photo_url = 'https://clbhouzlive.lovable.app/player-headshots/gordon-sargent.webp',
    updated_at = now()
WHERE id = 'd62542a1-3e5f-4bda-be72-cfecd738c183';