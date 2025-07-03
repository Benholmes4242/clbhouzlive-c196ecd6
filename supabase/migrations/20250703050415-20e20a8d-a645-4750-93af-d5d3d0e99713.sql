-- Clean up existing usernames by removing spaces and converting to lowercase
UPDATE user_profiles 
SET username = LOWER(REPLACE(username, ' ', ''))
WHERE username IS NOT NULL 
AND username LIKE '% %';

-- Also clean up any usernames that have @ symbols
UPDATE user_profiles 
SET username = LOWER(REPLACE(username, '@', ''))
WHERE username IS NOT NULL 
AND username LIKE '%@%';