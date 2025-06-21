
-- Create a table to store different types of taggable entities
CREATE TABLE public.taggable_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('user', 'golf_club', 'business')),
  entity_id uuid NOT NULL,
  name text NOT NULL,
  username text, -- for users and businesses that have usernames
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create a table to store post tags
CREATE TABLE public.post_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_entity_id uuid NOT NULL REFERENCES public.taggable_entities(id) ON DELETE CASCADE,
  tagged_by_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_taggable_entities_type_name ON public.taggable_entities(entity_type, name);
CREATE INDEX idx_taggable_entities_username ON public.taggable_entities(username) WHERE username IS NOT NULL;
CREATE INDEX idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tagged_entity ON public.post_tags(tagged_entity_id);

-- Enable RLS for post_tags
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggable_entities ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_tags
CREATE POLICY "Anyone can view post tags" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "Users can create post tags" ON public.post_tags FOR INSERT WITH CHECK (auth.uid() = tagged_by_user_id);
CREATE POLICY "Users can delete their own post tags" ON public.post_tags FOR DELETE USING (auth.uid() = tagged_by_user_id);

-- RLS policies for taggable_entities
CREATE POLICY "Anyone can view taggable entities" ON public.taggable_entities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create taggable entities" ON public.taggable_entities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically populate user entities when a user profile is created
CREATE OR REPLACE FUNCTION public.create_user_taggable_entity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username)
  VALUES (
    'user',
    NEW.id,
    COALESCE(NEW.display_name, NEW.username, 'User'),
    NEW.username
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create taggable entity when user profile is created or updated
CREATE TRIGGER on_user_profile_upsert
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_taggable_entity();

-- Function to create tag notifications
CREATE OR REPLACE FUNCTION public.create_tag_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tagged_user_id uuid;
  tagger_name text;
BEGIN
  -- Only create notifications for user tags
  SELECT entity_id INTO tagged_user_id 
  FROM public.taggable_entities 
  WHERE id = NEW.tagged_entity_id AND entity_type = 'user';
  
  IF tagged_user_id IS NOT NULL THEN
    -- Get the tagger's name
    SELECT COALESCE(display_name, username, 'Someone') INTO tagger_name
    FROM public.user_profiles 
    WHERE id = NEW.tagged_by_user_id;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      tagged_user_id,
      'tag',
      'You were tagged in a post',
      tagger_name || ' tagged you in a post',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'tagged_by_user_id', NEW.tagged_by_user_id,
        'tagger_name', tagger_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to create notifications when users are tagged
CREATE TRIGGER on_post_tag_created
  AFTER INSERT ON public.post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tag_notification();

-- Populate existing users as taggable entities
INSERT INTO public.taggable_entities (entity_type, entity_id, name, username)
SELECT 
  'user',
  id,
  COALESCE(display_name, username, 'User'),
  username
FROM public.user_profiles
ON CONFLICT DO NOTHING;
