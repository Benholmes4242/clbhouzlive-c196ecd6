/**
 * SituationBand — the standfirst beneath the overview photo (Phase 2.1).
 * Renders tournamentHeadline()'s one sentence and nothing else: no eyebrow,
 * no label, no icon, no fill, no border. Key figures (leading score, margin)
 * take weight 700 at full INK. Never clamped or truncated. A sentence is
 * language, so the hero's 10px marker exception does not apply (13.5 ≥ 11).
 */
import type { HeadlineSegment } from '../../../overview/magazineCopy';
import { INK, OVERVIEW_SITUATION_INK } from '../../../_shared/tokens';

export function SituationBand({ segments }: { segments: HeadlineSegment[] }) {
  return (
    <p
      style={{
        margin: 0,
        padding: '12px 16px',
        fontSize: 13.5,
        lineHeight: 1.5,
        fontWeight: 400,
        color: OVERVIEW_SITUATION_INK,
      }}
    >
      {segments.map((segment, index) =>
        segment.figure ? (
          <strong key={index} style={{ fontWeight: 700, color: INK, fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1' }}>
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
