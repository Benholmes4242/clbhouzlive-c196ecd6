
-- Create a public "avatars" storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Allow anyone to upload to, update, delete from, and read the avatars bucket (override as needed)
-- Allow upload
create policy "Anyone can upload images to avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars');
-- Allow update
create policy "Anyone can update images in avatars"
  on storage.objects for update
  using (bucket_id = 'avatars');
-- Allow delete
create policy "Anyone can delete images in avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars');
-- Allow read
create policy "Anyone can read images in avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
