-- Create taggable_entities table to unify users, golf clubs, and businesses
CREATE TABLE public.taggable_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('user', 'golf_club', 'business')),
  entity_id uuid NOT NULL,
  name text NOT NULL,
  username text,
  profile_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Create post_tags table to store tag relationships
CREATE TABLE public.post_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_entity_id uuid NOT NULL REFERENCES public.taggable_entities(id) ON DELETE CASCADE,
  start_index integer NOT NULL,
  end_index integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, tagged_entity_id, start_index)
);

-- Enable RLS on both tables
ALTER TABLE public.taggable_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for taggable_entities
CREATE POLICY "Everyone can view taggable entities"
ON public.taggable_entities
FOR SELECT
USING (true);

CREATE POLICY "System can manage taggable entities"
ON public.taggable_entities
FOR ALL
USING (false)
WITH CHECK (false);

-- RLS policies for post_tags
CREATE POLICY "Everyone can view post tags"
ON public.post_tags
FOR SELECT
USING (true);

CREATE POLICY "Users can create tags for their own posts"
ON public.post_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_tags.post_id
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tags for their own posts"
ON public.post_tags
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_tags.post_id
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tags from their own posts"
ON public.post_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_tags.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_taggable_entities_type_name ON public.taggable_entities(entity_type, name);
CREATE INDEX idx_taggable_entities_username ON public.taggable_entities(username) WHERE username IS NOT NULL;
CREATE INDEX idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tagged_entity_id ON public.post_tags(tagged_entity_id);

-- Function to populate taggable_entities from existing data
CREATE OR REPLACE FUNCTION public.populate_taggable_entities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert users
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'user'::text,
    id,
    COALESCE(display_name, username, 'User'),
    username,
    profile_photo_url
  FROM public.user_profiles
  WHERE user_type = 'individual' OR user_type IS NULL
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  -- Insert business accounts
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'business'::text,
    id,
    COALESCE(business_name, display_name, username, 'Business'),
    username,
    COALESCE(logo_url, profile_photo_url)
  FROM public.user_profiles
  WHERE user_type IN ('club', 'pro_shop', 'academy', 'tour_event', 'other')
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  -- Insert golf clubs
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  SELECT 
    'golf_club'::text,
    id,
    name,
    NULL,
    thumbnail_image
  FROM public.golf_courses
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();
END;
$$;

-- Triggers to keep taggable_entities in sync
CREATE OR REPLACE FUNCTION public.sync_user_to_taggable_entities()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Determine entity type based on user_type
  CASE NEW.user_type
    WHEN 'individual' THEN
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'user'::text,
        NEW.id,
        COALESCE(NEW.display_name, NEW.username, 'User'),
        NEW.username,
        NEW.profile_photo_url
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
    ELSE
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'business'::text,
        NEW.id,
        COALESCE(NEW.business_name, NEW.display_name, NEW.username, 'Business'),
        NEW.username,
        COALESCE(NEW.logo_url, NEW.profile_photo_url)
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
  END CASE;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_golf_course_to_taggable_entities()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  VALUES (
    'golf_club'::text,
    NEW.id,
    NEW.name,
    NULL,
    NEW.thumbnail_image
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER sync_user_profiles_to_taggable_entities
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_taggable_entities();

CREATE TRIGGER sync_golf_courses_to_taggable_entities
  AFTER INSERT OR UPDATE ON public.golf_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_golf_course_to_taggable_entities();

-- Populate existing data
SELECT public.populate_taggable_entities();