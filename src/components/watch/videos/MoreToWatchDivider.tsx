import { memo } from 'react';
import { moodCategoryLabel, type VideosMoodId } from './hooks/useVideosMood';

interface MoreToWatchDividerProps {
  mood: VideosMoodId;
}

/**
 * Visual break between the Pro Shop editorial sections (above) and the
 * full vertical videos feed (below). Title + sub reflect the active mood
 * filter so the chips visibly drive the feed below.
 */
function MoreToWatchDividerInner({ mood }: MoreToWatchDividerProps) {
  const categoryLabel = moodCategoryLabel(mood); // course_vlogs/coaching/tournaments -> label, else null

  let title = 'More to watch';
  let sub = 'The full videos feed';
  if (categoryLabel) {
    title = categoryLabel;
    sub = `Showing ${categoryLabel.toLowerCase()} videos`;
  } else if (mood === 'friends') {
    title = 'From people you follow';
    sub = 'Long-form videos from your follows';
  }

  return (
    <div
      style={{
        padding: '32px 16px 12px',
        borderTop: '1px solid rgba(15,23,42,0.06)',
        marginTop: 16,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#0F172A',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.55)',
          margin: '4px 0 0',
          lineHeight: 1.35,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

export const MoreToWatchDivider = memo(MoreToWatchDividerInner);
export default MoreToWatchDivider;
