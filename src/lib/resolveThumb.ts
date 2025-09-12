export type MediaThumb = {
  postId: string;
  url: string;          // original media url (image or video)
  thumbUrl?: string | null;  // small image to show in grids
  posterUrl?: string | null; // for videos (first frame)
  type: string;         // "image" | "video" etc.
  streamId?: string | null;  // Cloudflare Stream id if you have it
  width?: number | null;
  height?: number | null;
  createdAt: string;
};

export function resolveThumbUrl(m: MediaThumb): string {
  // 1) explicit thumbnail
  if (m.thumbUrl) return m.thumbUrl;

  // 2) explicit video poster
  if (m.posterUrl) return m.posterUrl;

  // 3) Cloudflare Stream (if you store streamId)
  if (m.type?.startsWith("video") && m.streamId) {
    // adjust query params to match your Stream setup
    return `https://videodelivery.net/${m.streamId}/thumbnails/thumbnail.jpg?time=1s&height=160`;
  }

  // 4) images: original works fine as a thumb
  if (m.type?.startsWith("image")) return m.url;

  // 5) ultimate fallback (local asset)
  return "/lovable-uploads/37c5b77e-4f6c-44a1-b834-007c27cd7e4b.png"; // Using existing golf fallback
}