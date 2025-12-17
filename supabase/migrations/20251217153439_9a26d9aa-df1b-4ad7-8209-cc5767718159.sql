-- Fix taggable_entities RLS policy to correctly expose business entities
-- (Current policy checks user_profiles for both user + business, which hides businesses)

ALTER POLICY "Public can view entities from public profiles"
ON public.taggable_entities
USING (
  CASE
    WHEN entity_type = 'user' THEN EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = public.taggable_entities.entity_id
        AND up.is_public = true
    )
    WHEN entity_type = 'business' THEN EXISTS (
      SELECT 1
      FROM public.business_accounts ba
      WHERE ba.id = public.taggable_entities.entity_id
        AND ba.is_deleted = false
    )
    WHEN entity_type = 'golf_club' THEN true
    ELSE false
  END
);

ALTER POLICY "Users can view their own entities"
ON public.taggable_entities
USING (
  CASE
    WHEN entity_type = 'user' THEN (public.taggable_entities.entity_id = auth.uid())
    WHEN entity_type = 'business' THEN EXISTS (
      SELECT 1
      FROM public.business_members bm
      WHERE bm.business_id = public.taggable_entities.entity_id
        AND bm.user_profile_id = auth.uid()
    )
    ELSE false
  END
);
