// Adapter to transform Club Media API response to ExploreContentItem format
// This enables reuse of existing Explore components (MediaCard, MediaDisplay, etc.)

export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  comments?: number;
  shares?: number;
  duration?: string;
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
  media?: {
    id: string;
    media_type: 'video' | 'image';
    media_url: string;
  }[];
  audioTrack?: {
    title: string;
    artist?: string;
    isOriginal?: boolean;
  };
}

// Helper to extract Stream UID from HLS URL
const extractStreamUidFromHls = (hls: string): string | null => {
  try {
    const url = new URL(hls);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] || null;
  } catch {
    return null;
  }
};

// Helper to generate Stream thumbnail URL
const getStreamThumbnail = (uid: string): string => 
  `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600`;

// Transform Club Media item to ExploreContentItem format
export const adaptClubMediaToExploreItem = (clubMediaItem: any): ExploreContentItem => {
  const isVideo = clubMediaItem.type === 'video';
  const src = clubMediaItem.url;
  
  // For videos, extract Stream UID and generate thumbnail
  const streamUid = isVideo ? extractStreamUidFromHls(src) : null;
  const thumbnailUrl = clubMediaItem.thumbnailUrl || 
    (streamUid ? getStreamThumbnail(streamUid) : src);

  return {
    id: clubMediaItem.id,
    type: clubMediaItem.type as 'video' | 'image',
    src,
    title: '', // Club media doesn't have titles
    likes: 0,  // Club media doesn't have likes
    user: clubMediaItem.author ? {
      id: clubMediaItem.author.id,
      name: clubMediaItem.author.displayName,
      username: clubMediaItem.author.username || undefined,
      avatar: clubMediaItem.author.avatarUrl,
      verified: false
    } : undefined,
    media: [{
      id: clubMediaItem.id,
      media_type: clubMediaItem.type as 'video' | 'image',
      media_url: thumbnailUrl // Use thumbnail for grid display
    }]
  };
};

// Transform array of club media items
export const adaptClubMediaArrayToExploreItems = (clubMediaArray: any[]): ExploreContentItem[] => {
  return clubMediaArray.map(adaptClubMediaToExploreItem);
};