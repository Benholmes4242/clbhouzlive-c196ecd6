
-- =========================================================================
-- B2: extend reports table so reviews and DM messages are traceable
-- =========================================================================
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_review_id uuid REFERENCES public.course_ratings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reported_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS reports_reported_review_id_idx ON public.reports(reported_review_id);
CREATE INDEX IF NOT EXISTS reports_reported_message_id_idx ON public.reports(reported_message_id);

-- =========================================================================
-- B5: profanity / banned-term filter (server side)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.moderation_banned_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (term)
);

GRANT SELECT ON public.moderation_banned_terms TO authenticated;
GRANT ALL ON public.moderation_banned_terms TO service_role;

ALTER TABLE public.moderation_banned_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read banned terms"
  ON public.moderation_banned_terms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage banned terms"
  ON public.moderation_banned_terms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed a conservative baseline. Real list managed by admin panel over time.
INSERT INTO public.moderation_banned_terms (term) VALUES
  ('faggot'),('nigger'),('nigga'),('retard'),('kike'),('spic'),
  ('chink'),('tranny'),('cunt'),('rapist'),('pedo'),('pedophile')
ON CONFLICT (term) DO NOTHING;

CREATE OR REPLACE FUNCTION public.contains_banned_term(_text text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lower text;
BEGIN
  IF _text IS NULL OR length(trim(_text)) = 0 THEN
    RETURN false;
  END IF;
  v_lower := lower(_text);
  RETURN EXISTS (
    SELECT 1 FROM public.moderation_banned_terms
    WHERE v_lower ~* ('\m' || lower(term) || '\M')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_reject_banned_terms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check text;
BEGIN
  -- Table-specific column mapping
  IF TG_TABLE_NAME = 'posts' THEN
    v_check := COALESCE(NEW.content, '');
  ELSIF TG_TABLE_NAME = 'comments_v2' THEN
    v_check := COALESCE(NEW.content, '');
  ELSIF TG_TABLE_NAME = 'course_ratings' THEN
    v_check := COALESCE(NEW.review, '') || ' ' || COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.verdict, '');
  ELSIF TG_TABLE_NAME = 'messages' THEN
    v_check := COALESCE(NEW.body, '');
  ELSE
    RETURN NEW;
  END IF;

  IF public.contains_banned_term(v_check) THEN
    RAISE EXCEPTION 'This content violates our community standards.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_banned_terms_posts ON public.posts;
CREATE TRIGGER reject_banned_terms_posts
  BEFORE INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_reject_banned_terms();

DROP TRIGGER IF EXISTS reject_banned_terms_comments_v2 ON public.comments_v2;
CREATE TRIGGER reject_banned_terms_comments_v2
  BEFORE INSERT OR UPDATE OF content ON public.comments_v2
  FOR EACH ROW EXECUTE FUNCTION public.tg_reject_banned_terms();

DROP TRIGGER IF EXISTS reject_banned_terms_course_ratings ON public.course_ratings;
CREATE TRIGGER reject_banned_terms_course_ratings
  BEFORE INSERT OR UPDATE OF review, title, verdict ON public.course_ratings
  FOR EACH ROW EXECUTE FUNCTION public.tg_reject_banned_terms();

DROP TRIGGER IF EXISTS reject_banned_terms_messages ON public.messages;
CREATE TRIGGER reject_banned_terms_messages
  BEFORE INSERT OR UPDATE OF body ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_reject_banned_terms();

-- =========================================================================
-- B4: notify admins whenever new report / post_report / user_block arrives
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_notify_admin_content_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
  VALUES (
    'content_report',
    'New content report',
    COALESCE(NEW.reason, 'A user submitted a report'),
    jsonb_build_object(
      'report_id', NEW.id,
      'reporter_id', NEW.reporter_id,
      'reported_user_id', NEW.reported_user_id,
      'reported_review_id', NEW.reported_review_id,
      'reported_message_id', NEW.reported_message_id,
      'reported_conversation_id', NEW.reported_conversation_id,
      'reason', NEW.reason,
      'details', NEW.details
    ),
    'moderators',
    '/admin-v2/moderation'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_on_report ON public.reports;
CREATE TRIGGER notify_admin_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admin_content_report();

CREATE OR REPLACE FUNCTION public.tg_notify_admin_post_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
  VALUES (
    'content_report',
    'New post report',
    COALESCE(NEW.reason, 'A user reported a post'),
    jsonb_build_object(
      'post_report_id', NEW.id,
      'reporter_id', NEW.reporter_id,
      'post_id', NEW.post_id,
      'reason', NEW.reason
    ),
    'moderators',
    '/admin-v2/moderation'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_on_post_report ON public.post_reports;
CREATE TRIGGER notify_admin_on_post_report
  AFTER INSERT ON public.post_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admin_post_report();

CREATE OR REPLACE FUNCTION public.tg_notify_admin_user_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
  VALUES (
    'user_block',
    'User blocked another user',
    'A member blocked another member',
    jsonb_build_object(
      'blocker_id', NEW.blocker_id,
      'blocked_id', NEW.blocked_id
    ),
    'moderators',
    '/admin-v2/moderation'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_on_user_block ON public.user_blocks;
CREATE TRIGGER notify_admin_on_user_block
  AFTER INSERT ON public.user_blocks
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_admin_user_block();

-- =========================================================================
-- B3: helper used by client hooks to filter blocked-user content
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_blocked_user_ids(_user_id uuid)
RETURNS TABLE(blocked_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ub.blocked_id FROM public.user_blocks ub WHERE ub.blocker_id = _user_id
  UNION
  SELECT ub2.blocker_id FROM public.user_blocks ub2 WHERE ub2.blocked_id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_blocked_user_ids(uuid) TO authenticated;
