import { Video } from 'lucide-react';
export function ReviewMediaPreview({ type, previewUrl, posterUrl, alt = '' }: { type: 'image' | 'video'; previewUrl: string; posterUrl?: string | null; alt?: string }) {
  const src = type === 'video' ? posterUrl : previewUrl;
  return src ? <img src={src} alt={alt} className="review-upload-image" /> : <div className="review-upload-no-preview" aria-label="No preview"><Video size={22} /></div>;
}
