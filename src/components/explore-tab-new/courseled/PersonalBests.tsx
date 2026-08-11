import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';

import { ATW_PHOTO_HEIGHTS, relativeWhen } from './AroundTheWorld';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { usePersonalBests, PERSONAL_BESTS_PER_MEMBER } from './hooks/usePersonalBests';
import { createMasonryAssignment, placeStable } from './stableMasonry';
import { Eyebrow, LABEL } from './tokens';
import { StandoutTile } from './StandoutTile';

/**
 * PERSONAL BESTS (BRIEF_PERSONAL_BESTS_SECTION).
 *
 * The second tier below Standout Rounds. Every feat there is FIELD-relative, so
 * only the lowest handicaps ever qualify; here the bar is the member's OWN
 * history at that course, which anyone who plays can clear.
 *
 * THE CLIENT DOES NOT THINK. The RPC has already applied one feat per round,
 * one per member per day, one KIND per member, the per-member cap, and the
 * order (play_date DESC, then rarity). This file renders that list, applies the
 * cross-section member budget, and nothing else. `headline` and
 * `reference_line` are server strings and are never reworded here.
 */

/** Eight tiles maximum, matching PAGE = 8 in AroundTheWorld (§3.2). */
const PAGE = 8;

interface Props {
  userId: string | undefined;
  /**
   * How many tiles each member holds in Standout Rounds AS RENDERED (§4.2b).
   * `null` means that section has NOT SETTLED — this one then renders nothing,
   * because filtering after paint is the visible reshuffle §4.4 forbids.
   */
  standoutCounts: Map<string, number> | null;
  onCoursePress: (courseId: string) => void;
  onFeatPress?: (scoreId: string, ownerId: string | null) => void;
}

export function PersonalBests({
  userId,
  standoutCounts,
  onCoursePress,
  onFeatPress,
}: Props) {
  const { t } = useTranslation('courses');
  const query = usePersonalBests(userId);

  /**
   * BEN'S RESOLUTION (§4.4): the budget is computed ONCE per mount from
   * whatever Standout Rounds was showing at that moment, and HELD. Switching
   * lens re-renders the upper section and leaves this one untouched.
   */
  const heldCounts = useRef<Map<string, number> | null>(null);
  if (heldCounts.current === null && standoutCounts !== null) {
    heldCounts.current = new Map(standoutCounts);
  }
  const budgetSource = heldCounts.current;

  /** Column memory, so a refetch never moves a tile the member has seen (§i). */
  const masonry = useRef(createMasonryAssignment());

  /**
   * THE BUDGET WALK (§4.2 c-e). In the RPC's order, keep a row while its member
   * still has allowance, decrement, stop at 8. NEVER re-sorted.
   */
  const kept = useMemo(() => {
    const rows = query.data ?? [];
    if (!budgetSource) return [];
    const allowance = new Map<string, number>();
    const out: typeof rows = [];
    for (const r of rows) {
      if (out.length >= PAGE) break;
      if (!allowance.has(r.user_id)) {
        const used = budgetSource.get(r.user_id) ?? 0;
        allowance.set(r.user_id, Math.max(0, PERSONAL_BESTS_PER_MEMBER - used));
      }
      const left = allowance.get(r.user_id) ?? 0;
      if (left <= 0) continue;
      allowance.set(r.user_id, left - 1);
      out.push(r);
    }
    return out;
  }, [query.data, budgetSource]);

  const courseIds = useMemo(
    () => Array.from(new Set(kept.map((r) => r.course_id).filter(Boolean))),
    [kept],
  );
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  /**
   * UNRESOLVED IS NOT ABSENT (§6.2). `isFetched`, never `!isLoading` — a
   * disabled or not-yet-run v5 query reports isLoading false. While unsettled,
   * or before the budget exists, render NOTHING: no heading, no skeleton (§6.3).
   */
  const settled =
    query.isFetched && (courseIds.length === 0 || metaQuery.isFetched);
  if (!budgetSource || !settled) return null;
  // A member with no qualifying feats sees no section at all (§6.1).
  if (kept.length === 0) return null;

  const tiles = kept.map((r, i) => {
    const m = meta?.get(r.course_id);
    const photo = ATW_PHOTO_HEIGHTS[Math.min(i, ATW_PHOTO_HEIGHTS.length - 1)];
    const headline = r.headline ?? '';
    const reference = r.reference_line ?? null;
    return {
      r,
      m,
      photo,
      headline,
      reference,
      slotKey: `${r.whs_score_id}:${r.feat_kind}`,
      // Deterministic height estimate, same grammar as the sibling section:
      // padding 23 + WHO 18 + detail lines (16) + reference lines (14).
      height:
        photo +
        23 +
        18 +
        (headline ? 2 + Math.min(2, Math.ceil(headline.length / 24)) * 16 : 0) +
        (reference ? 3 + Math.min(2, Math.ceil(reference.length / 26)) * 14 : 0),
    };
  });

  const { columns } = placeStable(tiles, masonry.current);

  return (
    <section>
      <Eyebrow aside={<span style={LABEL}>{t('discover.last90', 'Last 90 days')}</span>}>
        {t('discover.personalBests', 'Personal bests')}
      </Eyebrow>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {columns.map((col, ci) => (
          <div
            key={ci}
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {col.map((tt) => (
              <StandoutTile
                key={tt.slotKey}
                courseId={tt.r.course_id}
                courseName={
                  tt.m?.name ?? tt.r.course_name ?? t('discover.unknownCourse', 'Course')
                }
                imageUrl={tt.m?.imageUrl ?? null}
                region={tt.m?.region ?? tt.r.region ?? null}
                photo={tt.photo}
                figure={tt.r.figure}
                // THE UNIT IS NEVER HARDCODED (§3.4).
                unit={(tt.r.figure_unit ?? '').toUpperCase()}
                whenLabel={relativeWhen(tt.r.play_date, t)}
                who={
                  tt.r.is_self
                    ? t('discover.wire.you', 'You')
                    : (tt.r.display_name?.trim() ?? '')
                }
                isOwn={tt.r.is_self}
                detail={tt.headline}
                subline={tt.reference}
                onDetailPress={
                  onFeatPress
                    ? () => {
                        analyticsEvents.track('discover_personal_best_tap', {
                          feat: tt.r.feat_kind,
                        });
                        onFeatPress(tt.r.whs_score_id, tt.r.user_id);
                      }
                    : undefined
                }
                onPress={() => onCoursePress(tt.r.course_id)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PersonalBests;
