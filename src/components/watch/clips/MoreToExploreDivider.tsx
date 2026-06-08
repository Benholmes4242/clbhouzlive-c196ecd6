import { memo } from 'react';
import { clipsMoodLabel, clipsMoodSub, type ClipsMoodId } from './hooks/useClipsMood';

interface MoreToExploreDividerProps {
  mood?: ClipsMoodId;
}

/**
 * Visual break between the Pro Shop editorial sections (above) and the
 * full clips feed (below). Title + sub reflect the active mood filter so
 * the chips visibly drive the feed below.
 */
function MoreToExploreDividerInner({ mood = 'for_you' }: MoreToExploreDividerProps) {
  const label = clipsMoodLabel(mood);
  const sub = clipsMoodSub(mood);

  const title = label ?? 'More to explore';
  const subtitle = sub ?? 'The full clips feed';

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
        {subtitle}
      </p>
    </div>
  );
}

export const MoreToExploreDivider = memo(MoreToExploreDividerInner);
export default MoreToExploreDivider;
