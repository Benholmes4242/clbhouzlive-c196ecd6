-- Add FKs to user_profiles for PostgREST join hints
-- (existing FKs to auth.users are kept for referential integrity)

ALTER TABLE top_ten_reactions
  ADD CONSTRAINT top_ten_reactions_reactor_id_profiles_fkey
  FOREIGN KEY (reactor_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE top_ten_reactions
  ADD CONSTRAINT top_ten_reactions_target_user_id_profiles_fkey
  FOREIGN KEY (target_user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE top_ten_comments
  ADD CONSTRAINT top_ten_comments_commenter_id_profiles_fkey
  FOREIGN KEY (commenter_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE top_ten_comments
  ADD CONSTRAINT top_ten_comments_target_user_id_profiles_fkey
  FOREIGN KEY (target_user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;