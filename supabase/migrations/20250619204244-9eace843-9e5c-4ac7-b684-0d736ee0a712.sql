
-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_media table for images and videos
CREATE TABLE public.post_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view posts from friends and their own posts" 
  ON public.posts 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_friends 
      WHERE ((user_id = auth.uid() AND friend_id = posts.user_id) OR 
             (friend_id = auth.uid() AND user_id = posts.user_id))
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can create their own posts" 
  ON public.posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.posts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Post media policies
CREATE POLICY "Users can view media from viewable posts" 
  ON public.post_media 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id AND 
      (auth.uid() = posts.user_id OR 
       EXISTS (
         SELECT 1 FROM public.user_friends 
         WHERE ((user_id = auth.uid() AND friend_id = posts.user_id) OR 
                (friend_id = auth.uid() AND user_id = posts.user_id))
         AND status = 'accepted'
       ))
    )
  );

CREATE POLICY "Users can create media for their own posts" 
  ON public.post_media 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media for their own posts" 
  ON public.post_media 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media for their own posts" 
  ON public.post_media 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
    )
  );

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Storage policies for post media
CREATE POLICY "Anyone can upload post media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Anyone can view post media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Users can update their own post media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
