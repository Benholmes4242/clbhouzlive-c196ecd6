-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_exploration_stats ON course_ratings;

-- Recreate with INSERT, UPDATE, and DELETE
CREATE TRIGGER trigger_update_exploration_stats 
AFTER INSERT OR UPDATE OR DELETE ON public.course_ratings 
FOR EACH ROW EXECUTE FUNCTION update_exploration_stats();