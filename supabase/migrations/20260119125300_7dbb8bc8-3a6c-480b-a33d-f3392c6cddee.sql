-- Create second FK from posts.user_id to user_profiles.id (for PostgREST access)
ALTER TABLE posts
ADD CONSTRAINT posts_user_profile_id_fkey
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';