-- Add unique constraint on user_id for user_top_ten_lists table
ALTER TABLE public.user_top_ten_lists 
ADD CONSTRAINT user_top_ten_lists_user_id_unique UNIQUE (user_id);