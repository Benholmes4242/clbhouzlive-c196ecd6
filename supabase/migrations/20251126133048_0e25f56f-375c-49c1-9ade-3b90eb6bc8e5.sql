-- Drop the existing foreign key to auth.users
ALTER TABLE course_ratings
DROP CONSTRAINT course_ratings_user_id_fkey;

-- Add new foreign key to user_profiles with SET NULL on delete
ALTER TABLE course_ratings
ADD CONSTRAINT course_ratings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);