CREATE OR REPLACE FUNCTION public.create_tag_notification()
RETURNS TRIGGER AS $$
DECLARE
  tagged_user_id uuid;
  tagger_name text;
  tagger_username text;
  tagger_photo text;
  post_content_preview text;
BEGIN
  SELECT entity_id INTO tagged_user_id 
  FROM public.taggable_entities 
  WHERE id = NEW.tagged_entity_id AND entity_type = 'user';
  
  IF tagged_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF tagged_user_id = NEW.tagged_by_user_id THEN
    RETURN NEW;
  END IF;

  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username,
    profile_photo_url
  INTO tagger_name, tagger_username, tagger_photo
  FROM public.user_profiles 
  WHERE id = NEW.tagged_by_user_id;

  SELECT LEFT(COALESCE(content, ''), 50) INTO post_content_preview
  FROM public.posts
  WHERE id = NEW.post_id;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    recipient_actor_type,
    recipient_actor_id,
    data
  )
  VALUES (
    tagged_user_id,
    'tag',
    'You were tagged in a post',
    tagger_name || ' tagged you in a post',
    NEW.tagged_by_user_id,
    'personal',
    tagged_user_id,
    jsonb_build_object(
      'post_id', NEW.post_id,
      'tagged_by_user_id', NEW.tagged_by_user_id,
      'tagger_name', tagger_name,
      'tagger_username', tagger_username,
      'tagger_photo', tagger_photo,
      'post_preview', post_content_preview
    )
  )
  ON CONFLICT ON CONSTRAINT idx_notifications_dedup DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;