-- Fix Masters Tournament season_id from EURO to PGA 2026
UPDATE sr_tournaments 
SET season_id = '1882f3dd-cd2e-4210-90d9-fc401e3e0f19'
WHERE id = '2c5df93e-af44-4f2f-9602-be24d7717dd0'
AND name = 'Masters Tournament';