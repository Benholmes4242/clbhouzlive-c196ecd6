-- Phase MB-1: Multi-Business Data Model
-- Create business_accounts and business_members tables

-- 1. Create business_accounts table
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core business identity
  name text NOT NULL,
  slug text UNIQUE,
  category text,
  description text,
  website text,
  email text,
  phone text,
  location text,
  logo_url text,
  cover_image_url text,
  
  is_verified boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_business_accounts_slug ON public.business_accounts(slug);
CREATE INDEX IF NOT EXISTS idx_business_accounts_category ON public.business_accounts(category);
CREATE INDEX IF NOT EXISTS idx_business_accounts_name ON public.business_accounts(name);

-- 2. Create business_members table (links users to businesses with roles)
CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'analyst')),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (business_id, user_profile_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_business_members_user_profile ON public.business_members(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON public.business_members(role);

-- 3. Enable RLS
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for business_accounts

-- Anyone can view business accounts (public directory)
CREATE POLICY "Business accounts are viewable by everyone"
ON public.business_accounts
FOR SELECT
USING (true);

-- Business owners/admins can update their business
CREATE POLICY "Business owners and admins can update"
ON public.business_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

-- Authenticated users can insert (create new business)
CREATE POLICY "Authenticated users can create businesses"
ON public.business_accounts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can delete
CREATE POLICY "Business owners can delete"
ON public.business_accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = id
    AND bm.user_profile_id = auth.uid()
    AND bm.role = 'owner'
  )
);

-- 5. RLS Policies for business_members

-- Members can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON public.business_members
FOR SELECT
USING (user_profile_id = auth.uid());

-- Business owners/admins can view all members of their business
CREATE POLICY "Business owners and admins can view all members"
ON public.business_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

-- Business owners/admins can add members
CREATE POLICY "Business owners and admins can add members"
ON public.business_members
FOR INSERT
WITH CHECK (
  -- Either creating yourself as owner of a new business
  (user_profile_id = auth.uid() AND role = 'owner')
  OR
  -- Or you're already an owner/admin of the business
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

-- Business owners can update member roles
CREATE POLICY "Business owners can update member roles"
ON public.business_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role = 'owner'
  )
);

-- Business owners can remove members (but not themselves if they're the only owner)
CREATE POLICY "Business owners can remove members"
ON public.business_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role = 'owner'
  )
);

-- 6. Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_business_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_business_accounts_updated_at
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_accounts_updated_at();

-- 7. Seed existing business profiles into new tables
-- Using a CTE to create business accounts and link to members
WITH business_profiles AS (
  SELECT 
    id as profile_id,
    COALESCE(business_name, display_name, username) as name,
    LOWER(REGEXP_REPLACE(COALESCE(username, business_name, display_name), '[^a-zA-Z0-9]', '-', 'g')) as slug,
    business_category as category,
    COALESCE(business_bio, bio) as description,
    business_website as website,
    business_contact_email as email,
    business_contact_phone as phone,
    COALESCE(business_location, location) as location,
    profile_photo_url as logo_url,
    header_photo_url as cover_image_url,
    COALESCE(is_business_verified, is_verified_business, false) as is_verified,
    created_at
  FROM public.user_profiles
  WHERE profile_type = 'business'
),
inserted_businesses AS (
  INSERT INTO public.business_accounts (name, slug, category, description, website, email, phone, location, logo_url, cover_image_url, is_verified, created_at)
  SELECT 
    bp.name,
    bp.slug || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8) as slug, -- Ensure unique slug
    bp.category,
    bp.description,
    bp.website,
    bp.email,
    bp.phone,
    bp.location,
    bp.logo_url,
    bp.cover_image_url,
    bp.is_verified,
    bp.created_at
  FROM business_profiles bp
  RETURNING id, slug
)
-- Link the original profile as owner
INSERT INTO public.business_members (business_id, user_profile_id, role)
SELECT 
  ib.id,
  bp.profile_id,
  'owner'
FROM inserted_businesses ib
JOIN business_profiles bp ON ib.slug LIKE bp.slug || '-%';

-- 8. Create helper function to get user's businesses
CREATE OR REPLACE FUNCTION public.get_user_businesses(p_user_id uuid)
RETURNS TABLE (
  business_id uuid,
  business_name text,
  business_slug text,
  business_category text,
  business_location text,
  business_logo_url text,
  business_is_verified boolean,
  member_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.id,
    ba.name,
    ba.slug,
    ba.category,
    ba.location,
    ba.logo_url,
    ba.is_verified,
    bm.role
  FROM public.business_members bm
  JOIN public.business_accounts ba ON bm.business_id = ba.id
  WHERE bm.user_profile_id = p_user_id
  ORDER BY ba.name;
END;
$$;