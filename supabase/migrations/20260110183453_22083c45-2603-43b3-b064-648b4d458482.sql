-- Fix search_path for functions created in Phase 3 migration

-- Fix generate_creator_slug function
CREATE OR REPLACE FUNCTION public.generate_creator_slug(p_display_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(TRIM(p_display_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Ensure minimum length
  IF LENGTH(base_slug) < 3 THEN
    base_slug := base_slug || '-creator';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.creator_pages WHERE LOWER(slug) = LOWER(final_slug)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Fix get_default_creator_page function
CREATE OR REPLACE FUNCTION public.get_default_creator_page(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT cp.id
  FROM public.creator_pages cp
  JOIN public.creator_members cm ON cm.creator_page_id = cp.id
  WHERE cm.user_profile_id = p_user_id
    AND cm.role = 'owner'
  ORDER BY cp.created_at ASC
  LIMIT 1;
$$;

-- Fix set_updated_at trigger function (add search_path)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;