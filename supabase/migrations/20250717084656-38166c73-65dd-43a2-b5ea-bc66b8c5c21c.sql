-- Prevent new uploads to Supabase storage buckets by adding policies that deny all uploads
-- This ensures all new media goes to Cloudflare R2

-- Block all new uploads to avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Block all avatar uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND false);

-- Block all new uploads to post-media bucket
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;

CREATE POLICY "Block all post-media uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-media' AND false);

-- Block all new uploads to course-media bucket
CREATE POLICY "Block all course-media uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'course-media' AND false);

-- Block all new uploads to course-review-media bucket
CREATE POLICY "Block all course-review-media uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'course-review-media' AND false);

-- Block all new uploads to logos bucket
CREATE POLICY "Block all logos uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos' AND false);

-- Keep existing SELECT policies for backward compatibility with existing files
CREATE POLICY "Allow reading existing avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow reading existing post-media" ON storage.objects
FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Allow reading existing course-media" ON storage.objects
FOR SELECT USING (bucket_id = 'course-media');

CREATE POLICY "Allow reading existing course-review-media" ON storage.objects
FOR SELECT USING (bucket_id = 'course-review-media');

CREATE POLICY "Allow reading existing logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');