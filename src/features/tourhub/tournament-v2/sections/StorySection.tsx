/**
 * StorySection — completed-event editorial prose. Ports the query from
 * the old SummaryTab's sr_tournament_summaries source (not the
 * component) and renders as 13/1.55 ink prose with a ~6-line clamp
 * and an in-place "Read more" toggle. Self-hides when no story text.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionEyebrow } from './SectionEyebrow';
import { FONT, INK, INK_MUTE, SURFACE, HAIRLINE_INK_8 } from '../../_shared/tokens';

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
            WebkitLineClamp: expanded ? 'unset' as any : 6,
            overflow: expanded ? 'visible' : 'hidden',
          }}
        >
          {story}
        </p>
        {!expanded && story.length > 260 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              marginTop: 8, background: 'transparent', border: 'none', padding: 0,
              fontFamily: FONT, fontSize: 11, fontWeight: 800, color: INK_MUTE,
              letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            {t('tournament.story.readMore')} ›
          </button>
        )}
      </div>
    </section>
  );
}
