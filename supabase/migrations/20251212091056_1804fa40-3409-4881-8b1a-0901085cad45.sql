-- Fix the UPDATE policy for business_accounts - the join condition was wrong
DROP POLICY IF EXISTS "Business owners and admins can update" ON public.business_accounts;

CREATE POLICY "Business owners and admins can update" 
ON public.business_accounts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM business_members bm
    WHERE bm.business_id = business_accounts.id 
      AND bm.user_profile_id = auth.uid() 
      AND bm.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);

-- Also fix the DELETE policy which has the same bug
DROP POLICY IF EXISTS "Business owners can delete" ON public.business_accounts;

CREATE POLICY "Business owners can delete" 
ON public.business_accounts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM business_members bm
    WHERE bm.business_id = business_accounts.id 
      AND bm.user_profile_id = auth.uid() 
      AND bm.role = 'owner'::text
  )
);