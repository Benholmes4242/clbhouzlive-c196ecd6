import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { Users, Trophy, LayoutGrid, Sparkles, Map, type LucideIcon } from 'lucide-react';
import {
  AMBER,
  INK,
  INK_MUTE,
  INK_FAINT,
  SURFACE,
  HAIRLINE_INK_8,
} from '@/features/courses/_shared/tokens';

type CueVariant =
  | 'about'
  | 'holes'
  | 'champions'
  | 'progress'
  | 'leaderboard'
  | 'discover'
  | 'tour-venue'
  | 'tour-holes';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Variant catalogue. Copy is keyed and resolved via t() at the render site so
// the strings live in JSON (see courses.json > courseDetail.handicapCue.variants).
// {{name}} is always passed; unused interpolations are harmless.
const COPY: Record<CueVariant, { Icon: LucideIcon; benefitKey: string; subKey: string }> = {
  about:         { Icon: Users,      benefitKey: 'variants.about.benefit',       subKey: 'variants.about.sub' },
  holes:         { Icon: LayoutGrid, benefitKey: 'variants.holes.benefit',       subKey: 'variants.holes.sub' },
  champions:     { Icon: Trophy,     benefitKey: 'variants.champions.benefit',   subKey: 'variants.champions.sub' },
  progress:      { Icon: Sparkles,   benefitKey: 'variants.progress.benefit',    subKey: 'variants.progress.sub' },
  leaderboard:   { Icon: Trophy,     benefitKey: 'variants.leaderboard.benefit', subKey: 'variants.leaderboard.sub' },
  discover:      { Icon: Map,        benefitKey: 'variants.discover.benefit',    subKey: 'variants.discover.sub' },
  'tour-venue':  { Icon: Trophy,     benefitKey: 'variants.tour-venue.benefit',  subKey: 'variants.tour-venue.sub' },
  'tour-holes':  { Icon: LayoutGrid, benefitKey: 'variants.tour-holes.benefit',  subKey: 'variants.tour-holes.sub' },
};

interface Props {
  variant: CueVariant;
  courseName?: string;
}

export const ConnectHandicapCue: React.FC<Props> = ({ variant, courseName }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: connection, isFetched } = useWhsConnection(user?.id);

  /* UNRESOLVED IS NOT ABSENT: useWhsConnection is disabled until userId exists,
     and a disabled React Query v5 query is pending with fetchStatus 'idle', so
     isLoading is FALSE before it has ever run. Render nothing until settled. */
  const settled = !sessionLoading && isFetched;
  if (!user || !settled || connection) return null;

  const { Icon, benefitKey, subKey } = COPY[variant];
  const go = () => navigate('/handicap');

  const name = courseName ?? '';
  const benefit = t(`courseDetail.handicapCue.${benefitKey}`, { name });
  const sub = t(`courseDetail.handicapCue.${subKey}`, { name });
  const isBanner = variant === 'about' || variant === 'discover';
  const showBenefit = variant !== 'tour-venue';


  // Banner: lighter inline locked-comparison row (about / discover)
  if (isBanner) {
    return (
      <button
        type="button"
        onClick={go}
        style={{
          marginTop: 12,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: SURFACE,
          border: `1px solid ${HAIRLINE_INK_8}`,
          borderRadius: 12,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: FONT,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            {benefit}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
            {sub}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: AMBER,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {t('courseDetail.handicapCue.bannerAction')}
        </span>
      </button>
    );
  }


  // Holes + Champions: plain card
  return (
    <div style={{ padding: '12px 16px 4px' }}>
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${HAIRLINE_INK_8}`,
          borderRadius: 14,
          padding: 16,
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
              {benefit}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: INK_MUTE, marginTop: 3, lineHeight: 1.4 }}>
              {sub}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={go}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '11px 14px',
            background: AMBER,
            color: SURFACE,
            border: 'none',
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {t('courseDetail.handicapCue.cardCta')}
        </button>
        <div
          style={{
            marginTop: 9,
            fontSize: 10.5,
            fontWeight: 600,
            color: INK_FAINT,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {t('courseDetail.handicapCue.cardFootnote')}
        </div>
      </div>
    </div>
  );
};


export default ConnectHandicapCue;
