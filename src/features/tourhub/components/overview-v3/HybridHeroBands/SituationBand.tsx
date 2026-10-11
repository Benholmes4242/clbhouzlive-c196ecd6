/**
 * SituationBand — the standfirst beneath the overview photo.
 * BRIEF_TOUR_OVERVIEW_MOCK_EXACT §B: an amber THE SITUATION label, then
 * tournamentHeadline()'s one sentence. Emphasised figures take full INK at
 * weight 700, upright — never italic. Never clamped or truncated.
 */
import { useTranslation } from 'react-i18next';
import type { HeadlineSegment } from '../../../overview/magazineCopy';
import { AMBER, INK, OVERVIEW_SITUATION_INK } from '../../../_shared/tokens';

export function SituationBand({ segments }: { segments: HeadlineSegment[] }) {
  const { t } = useTranslation('tourhub');
  return (
    <div data-overview-situation style={{ padding: '15px 20px' }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: AMBER }}>
        {t('overview.situation.label')}
      </div>
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
    </div>
  );
}
