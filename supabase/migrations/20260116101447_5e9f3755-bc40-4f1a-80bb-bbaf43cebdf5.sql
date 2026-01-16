-- Delete the friendship record between Benjamin Holmes and Thomas Holmes
DELETE FROM user_friends 
WHERE id = '4ee86245-f222-486b-8f5e-7aab444ac076';

-- Delete any related friend request/accepted notifications for both users
DELETE FROM notifications 
WHERE (user_id = '8c240997-b6a1-408c-a953-794bc17ee35c' 
       OR user_id = '314366da-7472-44a5-988f-1a1a1553828d')
  AND type IN ('friend_request', 'friend_accepted');