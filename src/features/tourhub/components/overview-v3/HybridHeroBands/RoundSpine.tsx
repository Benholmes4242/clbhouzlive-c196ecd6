/** Shared live-only round nodes. Callers own visibility and the preceding seam;
 * the default margin preserves the Tour overview's measured photo geometry. */
import { useTranslation } from 'react-i18next';
import { OVERVIEW } from '../overviewTokens';
import { OVERVIEW_SPINE_LABEL_SIZE, OVERVIEW_SPINE_LABEL_LINE_HEIGHT, OVERVIEW_SPINE_MARGIN_TOP } from './photoBandGeometry';

export function RoundSpine({ round, totalRounds, marginTop = OVERVIEW_SPINE_MARGIN_TOP }: { round: number; totalRounds: number; marginTop?: number }) {
  const { t } = useTranslation('tourhub');
  const nodes = Array.from({ length: Math.max(0, totalRounds) }, (_, i) => i + 1);
  return (
    <div data-overview-round-spine style={{ display: 'flex', alignItems: 'center', marginTop }}>
      {nodes.map((n, i) => {
        const live = n === round;
        const done = n < round;
        return (
          <div key={n} style={{ display: 'contents' }}>
            {i > 0 ? <span aria-hidden style={{ flex: 1, height: 1, background: OVERVIEW.spine.connector, margin: '0 7px' }} /> : null}
            <span data-round-node={live ? 'live' : done ? 'done' : 'todo'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: live ? OVERVIEW.spine.live : done ? OVERVIEW.spine.done : OVERVIEW.spine.todo, boxShadow: live ? OVERVIEW.spine.liveHalo : undefined }} />
              <span style={{ fontSize: OVERVIEW_SPINE_LABEL_SIZE, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: OVERVIEW_SPINE_LABEL_LINE_HEIGHT, color: live ? OVERVIEW.spine.live : OVERVIEW.spine.label }}>{t('overview.hero.roundNode', { round: n })}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}