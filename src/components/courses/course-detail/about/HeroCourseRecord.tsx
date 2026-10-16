/**
 * HeroCourseRecord — BRIEF_COURSE_HERO_1 / 1A (hero-option-a.html).
 *
 * The course record row under the hero reference line. LOWEST GROSS ONLY —
 * it never carries stableford, net or differential holders.
 *
 * Holders come from useCourseRecordSummary (get_course_legends via
 * useCourseLegends), the same read the record boards use, so the hero and the
 * boards can never name different holders. No second fetch, no re-derivation.
 *
 * Absent cases: no record, or any holder without a showable name → null.
 * Not tappable by brief.
 */
import React from 'react';
import { SURFACE } from '@/lib/tokens/surface';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import type { CourseLegendRow } from '@/lib/gam/types';
import { displayName } from '@/lib/whs/utils/initials';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const INK = SURFACE.dark.ink;
const DIM = SURFACE.dark.dim;
const AVATAR = 22;
const OVERLAP = 7;
const MAX_AVATARS = 3;
/** Measured rendered row height (two-line text block, ~28px, taller than the
 *  22px avatars) + its 10px margin-top. The hero grows by exactly this; the
 *  mock's hero heights were context, not absolutes (BRIEF_COURSE_HERO_1B K1). */
export const HERO_RECORD_ROW_EXTRA = 38;

export function heroRecordNames(holders: CourseLegendRow[]): string | null {
  const names = holders.map((h) => displayName(h.user_display_name).trim());
  if (!names.length || names.some((n) => !n)) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} others`;
}

/** True when the hero renders the row; the hero height reads this. */
export function heroRecordVisible(holders: CourseLegendRow[]): boolean {
  return heroRecordNames(holders) != null;
}

function Avatar({ row, index }: { row: CourseLegendRow; index: number }) {
  const [failed, setFailed] = React.useState(false);
  const src = !failed ? row.user_photo_url : null;
  return (
    <span
      style={{
        width: AVATAR, height: AVATAR, borderRadius: '50%', overflow: 'hidden',
        marginLeft: index === 0 ? 0 : -OVERLAP, flex: '0 0 auto',
        border: '1.5px solid hsl(var(--background))',
        background: 'hsl(var(--muted))', color: INK,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 700, position: 'relative', zIndex: MAX_AVATARS - index,
      }}
    >
      {src ? (
        <img src={src} alt="" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : initials(row.user_display_name)}
    </span>
  );
}

export function HeroCourseRecord({ holders }: { holders: CourseLegendRow[] }) {
  const names = heroRecordNames(holders);
  if (!names) return null;
  const score = holders[0].value;
  return (
    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ display: 'inline-flex', flex: '0 0 auto' }}>
        {holders.slice(0, MAX_AVATARS).map((h, i) => <Avatar key={h.user_id} row={h} index={i} />)}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MEDAL_GOLD, lineHeight: 1.2 }}>
          Course record
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
          {names}
        </div>
      </div>
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span className="tabular-nums lining-nums" style={{ fontSize: 19, fontWeight: 800, color: MEDAL_GOLD, lineHeight: 1 }}>
          {Math.round(Number(score))}
        </span>
        <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, marginTop: 3 }}>
          Gross
        </span>
      </div>
    </div>
  );
}
