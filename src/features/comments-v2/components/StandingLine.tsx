/**
 * The commenter's standing at the post's course (BRIEF_COMMENTS_SHEET G.4).
 * 10.5px, tabular. The course record takes the scorecard gold at 700; every
 * other tier is the faint supporting ink (A.DIM — the analytical palette has
 * no separate FAINT; DIM is that value). No standing, no element.
 */
import { useTranslation } from 'react-i18next';
import { FIGS, A } from '@/features/courses/components/holes/analytical/tokens';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import type { Standing } from '../lib/standing';

export function StandingLine({ standing }: { standing: Standing | null | undefined }) {
  const { t } = useTranslation('common');
  if (!standing) return null;
  const record = standing.kind === 'record';
  const text =
    standing.kind === 'record' ? t('comments.standingRecord', { value: standing.value })
    : standing.kind === 'top_ten' ? t('comments.standingTopTen')
    : standing.kind === 'played' ? t('comments.standingPlayed', { count: standing.n })
    : t('comments.standingFirst');
  return (
    <div
      data-comment-standing={standing.kind}
      className="truncate"
      style={{
        ...FIGS,
        fontSize: 10.5,
        lineHeight: 1.4,
        marginTop: 1,
        fontVariantNumeric: 'tabular-nums',
        color: record ? SC_FILL_GOLD : A.DIM,
        fontWeight: record ? 700 : 400,
      }}
    >
      {text}
    </div>
  );
}
