import { GAM } from '../../../gam/tokens';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { usePlayerOtherTitles } from '@/hooks/gam/usePlayerOtherTitles';
import type { LegendWindow } from '@/lib/gam/types';

interface ChampionsListRowProps {
  rank: number;
  name: string;
  photoUrl: string | null;
  valueDisplay: string;
  unitLabel: string;
  isSelf: boolean;
  isChampion: boolean;
  gapToChampion: string | null;
  holdDuration: string | null;
  /** Champion's user_id — required to look up cross-course titles. */
  userId?: string | null;
  /** Current course id, excluded from cross-course title results. */
  currentCourseId?: string;
  /** Active window — filters cross-course titles to the same window. */
  window?: LegendWindow;
}


const SQUIRCLE_MASK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M40 0h20c22.091 0 40 17.909 40 40v20c0 22.091-17.909 40-40 40H40C17.909 100 0 82.091 0 60V40C0 17.909 17.909 0 40 0z'/%3E%3C/svg%3E\")";
const squircleMaskStyle: React.CSSProperties = {
  WebkitMaskImage: SQUIRCLE_MASK_URL,
  maskImage: SQUIRCLE_MASK_URL,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

export const ChampionsListRow: React.FC<ChampionsListRowProps> = ({
  rank,
  name,
  photoUrl,
  valueDisplay,
  unitLabel,
  isSelf,
  isChampion,
  gapToChampion,
  holdDuration,
  userId,
  currentCourseId,
  window: legendWindow,
}) => {
  const navigate = useNavigate();
  // Only fetch cross-course titles for the actual champion row (rank 1).
  const { data: otherTitles } = usePlayerOtherTitles(
    isChampion ? userId ?? undefined : undefined,
    isChampion ? currentCourseId : undefined,
    legendWindow ?? '90d',
  );

  // Deduplicate by course_id — a player might hold multiple categories at the same course.
  const uniqueOtherCourses = React.useMemo(() => {
    if (!otherTitles?.length) return [] as { course_id: string; course_name: string }[];
    const seen = new Set<string>();
    const out: { course_id: string; course_name: string }[] = [];
    for (const t of otherTitles) {
      if (!t.course_id || seen.has(t.course_id)) continue;
      seen.add(t.course_id);
      out.push({ course_id: t.course_id, course_name: t.course_name });
    }
    return out;
  }, [otherTitles]);

  const rowBg = isChampion ? 'var(--hcp-champ-wash, #FFF9EC)' : 'var(--hcp-bg-1, #fff)';
  const photoBg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)';

  const avatar = isChampion ? (
    <div style={{ width: 40, height: 40, position: 'relative', flexShrink: 0 }} aria-hidden>
      <div style={{ position: 'absolute', inset: 0, background: photoBg, ...squircleMaskStyle }} />
      <div style={{ position: 'absolute', inset: 0, ...squircleMaskStyle, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)' }} />
    </div>
  ) : (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: '34%',
        background: photoBg,
        boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)',
        flexShrink: 0,
      }}
    />
  );

  const subText = isChampion
    ? holdDuration
    : gapToChampion
      ? `${gapToChampion.replace('-', '−')} from champion`
      : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 40px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        background: rowBg,
        boxShadow: 'inset 0 -0.5px 0 rgba(15,23,42,0.07)',
      }}
    >
      {rank === 1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', lineHeight: 0 }} aria-label="Champion">
          <Crown size={15} strokeWidth={2.5} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER, flexShrink: 0 }} />
        </div>
      ) : (
        <div
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 15,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--hcp-t-30, #b3bdca)',
            lineHeight: 1,
            textAlign: 'right',
          }}
        >
          {rank}
        </div>
      )}

      {avatar}

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: isChampion ? 800 : 700,
            color: isSelf ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.014em',
            lineHeight: 1.25,
            marginBottom: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--hcp-t-50, #9aa6b2)',
            fontWeight: 500,
            letterSpacing: '-0.003em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {subText}
        </div>
        {isChampion && uniqueOtherCourses.length > 0 && (() => {
          const first = uniqueOtherCourses[0];
          const extra = uniqueOtherCourses.length - 1;
          // 1 → "Also champion at X"
          // 2 → "Also champion at X · +1 more"
          // 3+ → "Champion at X · +N more"
          const prefix = uniqueOtherCourses.length >= 3 ? 'Champion at' : 'Also champion at';
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${first.course_id}?tab=legends`);
              }}
              style={{
                marginTop: 3,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 11,
                color: 'var(--hcp-t-50, #9aa6b2)',
                fontWeight: 500,
                letterSpacing: '-0.003em',
                display: 'block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {prefix}{' '}
              <span style={{ color: GAM.DEEP_AMBER, fontWeight: 600 }}>{first.course_name}</span>
              {extra > 0 && (
                <span> · +{extra} more</span>
              )}
            </button>
          );
        })()}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: isSelf || isChampion ? GAM.DEEP_AMBER : 'var(--hcp-t-100, ' + GAM.INK + ')',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {valueDisplay}
        </span>
        {unitLabel && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--hcp-t-40, #aab4c0)',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'lowercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {unitLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChampionsListRow;
