-- Backfill: Mark all existing entries as pinned (they were manually added by users)
UPDATE user_top_ten_courses SET is_pinned = true WHERE is_pinned = false;