-- Mark all existing reviews as mock data
UPDATE course_ratings SET is_mock = true WHERE is_mock = false;