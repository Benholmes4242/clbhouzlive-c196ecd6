/**
 * SituationBand — the standfirst beneath the overview photo.
 * BRIEF_TOUR_OVERVIEW_MOCK_EXACT §B: an amber THE SITUATION label, then
 * tournamentHeadline()'s one sentence. Emphasised figures take full INK at
 * weight 700, upright — never italic. Never clamped or truncated.
 * BRIEF_TOUR_OVERVIEW_PICKS_CHIPS_AND_FULL_BOARD: an optional "Full board ›"
 * at the right of the label row. Its 44px target uses negative margin so the
 * row's height never changes; the caller decides when it may appear.
 */
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { HeadlineSegment } from '../../../overview/magazineCopy';
import { AMBER, FONT, INK, OVERVIEW_SITUATION_INK, WHITE_ALPHA_32 } from '../../../_shared/tokens';
import { OVERVIEW } from '../overviewTokens';

export function SituationBand({ segments, onFullBoard, note }: { segments: HeadlineSegment[]; onFullBoard?: () => void; /** Visible situation_note (caller applies its window). */ note?: string | null }) {
  const { t } = useTranslation('tourhub');
  const label = (
    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: AMBER }}>
      {t('overview.situation.label')}
    </div>
  );
  return (
    <div data-overview-situation style={{ padding: '15px 20px' }}>
      {onFullBoard ? (
        <div data-overview-situation-row style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {label}
          <button
            type="button"
            data-overview-full-board
            onClick={onFullBoard}
            aria-label="Full leaderboard"
            className="active:opacity-70 transition-opacity"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '12px 0 12px 12px', margin: '-12px 0', background: 'none', border: 'none', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: INK, cursor: 'pointer' }}
          >
            {t('overview.situation.fullBoard', { defaultValue: 'Full board' })}
            <ChevronRight size={13} strokeWidth={2.6} color={WHITE_ALPHA_32} aria-hidden />
          </button>
        </div>
      ) : label}
      <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.5, fontWeight: 400, color: OVERVIEW_SITUATION_INK }}>
        {segments.map((segment, index) =>
          segment.figure ? (
            <strong key={index} style={{ fontWeight: 700, fontStyle: 'normal', color: INK, fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1' }}>
              {segment.text}
            </strong>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      {note ? (
        <p data-overview-situation-note style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: OVERVIEW.soft }}>{note}</p>
      ) : null}
    </div>
  );
}
