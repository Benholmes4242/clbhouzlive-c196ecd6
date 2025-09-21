-- Performance indexes for global search functionality

-- User profiles indexes for search performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles (display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);

-- Golf courses indexes for search performance  
CREATE INDEX IF NOT EXISTS idx_golf_courses_name ON golf_courses (name);

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_user_profiles_search_public ON user_profiles (is_public, display_name) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_golf_courses_search_rank ON golf_courses (global_rank, name) WHERE global_rank IS NOT NULL;