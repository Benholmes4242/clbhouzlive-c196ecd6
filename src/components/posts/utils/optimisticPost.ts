
interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

export const createOptimisticPost = (
  user: any, 
  content: string, 
  mediaFiles: File[], 
  selectedTags: TaggableEntity[]
) => {
  const optimisticPost = {
    id: `temp-${Date.now()}`,
    content: content.trim() || null,
    created_at: new Date().toISOString(),
    user: {
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      username: user.user_metadata?.username || null,
      profile_photo_url: user.user_metadata?.profile_photo_url || null
    },
    post_media: mediaFiles.map((file, index) => ({
      id: `temp-media-${index}`,
      media_type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
      media_url: URL.createObjectURL(file),
      uploading: true
    })),
    post_tags: selectedTags,
    uploading: true
  };

  return optimisticPost;
};
