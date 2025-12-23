-- =====================================================
-- EXPLORE TAB DATABASE SCHEMA
-- =====================================================

-- 1) EXPLORE REGIONS TABLE
-- Canonical region system for "UK & Ireland / Continental Europe / USA" etc
CREATE TABLE public.explore_regions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  hero_image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.explore_regions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "explore_regions_public_read" ON public.explore_regions
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "explore_regions_admin_write" ON public.explore_regions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2) EXPLORE REGION MEMBERS TABLE
-- Maps country/sub_country combinations to regions
CREATE TABLE public.explore_region_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id uuid NOT NULL REFERENCES public.explore_regions(id) ON DELETE CASCADE,
  country text NOT NULL,
  sub_country text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.explore_region_members ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "explore_region_members_public_read" ON public.explore_region_members
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "explore_region_members_admin_write" ON public.explore_region_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Index for fast lookups
CREATE INDEX idx_explore_region_members_country ON public.explore_region_members(country, sub_country);
CREATE INDEX idx_explore_region_members_region ON public.explore_region_members(region_id);

-- 3) EXPLORE THEMES TABLE
-- Links / Parkland / Coastal etc
CREATE TABLE public.explore_themes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.explore_themes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "explore_themes_public_read" ON public.explore_themes
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "explore_themes_admin_write" ON public.explore_themes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4) EXPLORE COURSE THEMES TABLE
-- Junction table to classify courses by theme
CREATE TABLE public.explore_course_themes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES public.explore_themes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(course_id, theme_id)
);

-- Enable RLS
ALTER TABLE public.explore_course_themes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "explore_course_themes_public_read" ON public.explore_course_themes
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "explore_course_themes_admin_write" ON public.explore_course_themes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Indexes
CREATE INDEX idx_explore_course_themes_course ON public.explore_course_themes(course_id);
CREATE INDEX idx_explore_course_themes_theme ON public.explore_course_themes(theme_id);

-- 5) EXPLORE FEATURED COURSES TABLE
-- Editorial/curated "credibility anchors" cards
CREATE TABLE public.explore_featured_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  source_label text NOT NULL,
  card_media_url text NOT NULL,
  card_type text NOT NULL DEFAULT 'image' CHECK (card_type IN ('image', 'video')),
  play_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.explore_featured_courses ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "explore_featured_courses_public_read" ON public.explore_featured_courses
  FOR SELECT USING (true);

-- Admin write access  
CREATE POLICY "explore_featured_courses_admin_write" ON public.explore_featured_courses
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Indexes
CREATE INDEX idx_explore_featured_courses_active ON public.explore_featured_courses(active, sort_order);
CREATE INDEX idx_explore_featured_courses_course ON public.explore_featured_courses(course_id);

-- =====================================================
-- PERFORMANCE VIEWS FOR EXPLORE TAB
-- =====================================================

-- 6) COURSE ACTIVITY VIEW (30d)
-- Aggregates moments per course for trending calculations
CREATE OR REPLACE VIEW public.vw_course_activity_30d AS
SELECT 
  p.course_id,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '7 days') AS moments_7d,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '30 days') AS moments_30d,
  MAX(p.created_at) AS last_moment_at
FROM public.posts p
WHERE p.course_id IS NOT NULL
  AND p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.course_id;

-- 7) REGION ACTIVITY VIEW (30d)
-- Aggregates moments per region for trending calculations
CREATE OR REPLACE VIEW public.vw_region_activity_30d AS
SELECT 
  er.id AS region_id,
  er.slug,
  er.title,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '7 days') AS moments_7d,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '30 days') AS moments_30d
FROM public.explore_regions er
LEFT JOIN public.explore_region_members erm ON erm.region_id = er.id
LEFT JOIN public.golf_courses gc ON (
  gc.country = erm.country AND 
  (erm.sub_country IS NULL OR gc.sub_country = erm.sub_country)
)
LEFT JOIN public.posts p ON p.course_id = gc.id AND p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY er.id, er.slug, er.title;

-- 8) THEME ACTIVITY VIEW (30d)
-- Aggregates moments per theme for trending calculations
CREATE OR REPLACE VIEW public.vw_theme_activity_30d AS
SELECT 
  et.id AS theme_id,
  et.slug,
  et.title,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '7 days') AS moments_7d,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '30 days') AS moments_30d
FROM public.explore_themes et
LEFT JOIN public.explore_course_themes ect ON ect.theme_id = et.id
LEFT JOIN public.posts p ON p.course_id = ect.course_id AND p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY et.id, et.slug, et.title;

-- =====================================================
-- SEED DATA: REGIONS
-- =====================================================

INSERT INTO public.explore_regions (slug, title, subtitle, sort_order) VALUES
  ('uk-ireland', 'UK & Ireland', 'Timeless links and legendary fairways', 1),
  ('continental-europe', 'Continental Europe', 'Drama, elevation, unforgettable settings', 2),
  ('usa', 'USA', 'Championship courses across every landscape', 3),
  ('rest-of-world', 'Rest of the World', 'Hidden gems waiting to be discovered', 4);

-- Seed region members based on existing golf_courses country values
-- UK & Ireland
INSERT INTO public.explore_region_members (region_id, country) 
SELECT er.id, 'Britain & Ireland' FROM public.explore_regions er WHERE er.slug = 'uk-ireland';

-- USA
INSERT INTO public.explore_region_members (region_id, country) 
SELECT er.id, 'USA' FROM public.explore_regions er WHERE er.slug = 'usa';

-- Continental Europe
INSERT INTO public.explore_region_members (region_id, country) 
SELECT er.id, 'Continental Europe' FROM public.explore_regions er WHERE er.slug = 'continental-europe';

-- Rest of World - multiple regions
INSERT INTO public.explore_region_members (region_id, country) 
SELECT er.id, c.country
FROM public.explore_regions er, 
  (VALUES ('Australia & Oceania'), ('Asia'), ('Central & South America'), ('Caribbean'), ('Africa'), ('Middle East')) AS c(country)
WHERE er.slug = 'rest-of-world';

-- =====================================================
-- SEED DATA: THEMES
-- =====================================================

INSERT INTO public.explore_themes (slug, title, subtitle, icon, sort_order) VALUES
  ('links', 'Links Golf', 'Coastal masterpieces', 'Wind', 1),
  ('parkland', 'Parkland Classics', 'Tree-lined treasures', 'Trees', 2),
  ('coastal', 'Coastal Courses', 'Ocean views', 'Waves', 3),
  ('mountain', 'Mountain Courses', 'Elevated experiences', 'Mountain', 4),
  ('hidden-gems', 'Hidden Gems', 'Undiscovered treasures', 'Sparkles', 5);