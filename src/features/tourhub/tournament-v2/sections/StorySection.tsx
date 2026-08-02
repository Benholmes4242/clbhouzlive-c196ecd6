/**
 * StorySection — completed-event editorial prose. Ports the query from
 * the old SummaryTab's sr_tournament_summaries source (not the
 * component) and renders as 13/1.55 ink prose with a ~6-line clamp
 * and an in-place "Read more" toggle. Self-hides when no story text.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionEyebrow } from './SectionEyebrow';
import { FONT, INK, SURFACE, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { Action } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  story: string | null;
}

export function StorySection({ story }: Props) {
  const { t } = useTranslation('tourhub');
  const [expanded, setExpanded] = useState(false);
  if (!story) return null;

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionEyebrow kicker={t('tournament.story.eyebrow')} />
      <div
        style={{
          background: SURFACE,
          padding: '4px 16px 16px',
          borderTop: `0.5px solid ${HAIRLINE_INK_8}`,
          borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13, lineHeight: 1.55, color: INK, fontWeight: 500,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: expanded ? 'unset' : 6,
            overflow: expanded ? 'visible' : 'hidden',
          }}
        >
          {story}
        </p>
        {!expanded && story.length > 260 && (
          <Action
            label={t('tournament.story.readMore')}
            onClick={() => setExpanded(true)}
            align="left"
            style={{ marginTop: 4 }}
          />
        )}
      </div>
    </section>
  );
}
