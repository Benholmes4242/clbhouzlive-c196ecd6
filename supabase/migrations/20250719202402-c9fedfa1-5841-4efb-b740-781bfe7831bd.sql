-- Add RLS policy to allow viewing posts tagged with golf courses
CREATE POLICY "Anyone can view posts tagged with golf courses"
ON public.posts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM post_tags pt
    JOIN taggable_entities te ON pt.tagged_entity_id = te.id
    WHERE pt.post_id = posts.id 
    AND te.entity_type = 'golf_club'
  )
);