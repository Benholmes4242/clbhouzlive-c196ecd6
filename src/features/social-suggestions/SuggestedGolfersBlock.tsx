/**
 * BRIEF_SUGGESTED_GOLFERS S3.1 - the Activity block. Three reason-led rows,
 * placed inside the feed after the first day group, with a SEE ALL link to
 * /golferstofollow. Renders nothing unless the viewer follows fewer than
 * SUGGESTION_FOLLOW_THRESHOLD people and the rpc actually returned reasons.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ROW_FONT } from '@/features/social-lists-v2/rowParts';
import { SuggestedGolferRow } from './SuggestedGolferRow';
import { useSuggestedGolfers, useSuggestionGate } from './useSuggestedGolfers';

export function SuggestedGolfersBlock({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const gate = useSuggestionGate();
  const q = useSuggestedGolfers(rows, gate.eligible);

  if (!gate.eligible) return null;
  const people = (q.data ?? []).slice(0, rows);
  if (people.length === 0) return null;

  return (
    <section style={{ fontFamily: ROW_FONT, padding: '10px 0 6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '8px 18px 6px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
          }}
        >
          {t('suggestedGolfers.heading')}
        </div>
        <button
          type="button"
          onClick={() => navigate('/golferstofollow')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.AMBER,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          {t('suggestedGolfers.seeAll')}
        </button>
      </div>
      <div
        style={{
          background: A.PANEL,
          border: `0.5px solid ${A.BORDER}`,
          borderRadius: 14,
          margin: '0 14px',
          overflow: 'hidden',
        }}
      >
        {people.map((g, i) => (
          <SuggestedGolferRow key={g.user_id} golfer={g} showDivider={i < people.length - 1} />
        ))}
      </div>
    </section>
  );
}

export default SuggestedGolfersBlock;
