-- 1) visibility enum (safer than free text)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_visibility') THEN
    CREATE TYPE post_visibility AS ENUM ('anyone', 'followers', 'private');
  END IF;
END$$;

-- 2) Add visibility column with enum type
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS visibility post_visibility NOT NULL DEFAULT 'anyone';

-- 3) categories as text array (fast, flexible for now)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- 4) sanity check to prevent empty strings in categories
ALTER TABLE posts
  ADD CONSTRAINT posts_categories_no_empty
  CHECK (NOT ('' = ANY(categories)));

-- 5) GIN index for Discover filtering on categories
CREATE INDEX IF NOT EXISTS posts_categories_gin_idx
  ON posts USING GIN (categories);

-- 6) B-tree index for visibility filtering (feeds)
CREATE INDEX IF NOT EXISTS posts_visibility_idx
  ON posts (visibility);