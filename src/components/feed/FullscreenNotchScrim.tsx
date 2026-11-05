import type { RestingRect } from '@/lib/media/resolveRestingRect';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import './fullscreen-notch.css';

/** Rect-owned, slide-local notch protection; never classifies aspects or changes chrome/gallery geometry. */
export function FullscreenNotchScrim({ rect }: { rect: RestingRect }) {
  const gallery = useFullscreenFeedStore(s => s.courseGallery);
  if (gallery || rect.top !== 0) return null;
  return <div aria-hidden="true" data-fullscreen-notch-scrim className="fullscreen-notch-scrim" />;
}