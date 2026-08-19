import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { analyticsEvents } from '@/utils/analyticsEvents';

import { ATW_PHOTO_HEIGHTS, relativeWhen } from './AroundTheWorld';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { usePersonalBests, PERSONAL_BESTS_PER_MEMBER } from './hooks/usePersonalBests';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';
import { A, Eyebrow, LABEL } from './tokens';
import { StandoutTile } from './StandoutTile';
import {
  EffortTile,
  estimateEffortHeight,
  parseAttempts,
  parsePreviousBest,
  treatmentFor,
} from './PersonalBestTiles';

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

/**
 * THE GROUPS (BRIEF_STANDOUT_KIND_BUDGET §3.3), for the six kinds
 * get_personal_bests emits. Standout's names do NOT transfer: there is no
 * course-record equivalent here, and every Personal Best is a milestone, so
 * "Personal milestones" would name the whole section. Anything unmapped falls to
 * "Firsts here".
 */
const PB_GROUPS = [
  {
    id: 'firsts',
    kinds: ['first_sub_70_here', 'first_sub_80_here', 'first_double_free_here'],
    key: 'discover.pb.group.firsts',
    label: 'First time ever',
  },
  {
    id: 'best',
    kinds: ['big_points_here'],
    key: 'discover.pb.group.best',
    label: 'Big returns',
  },
  {
    id: 'most',
    kinds: ['most_birdies_here', 'most_pars_here'],
    key: 'discover.pb.group.most',
    label: 'New personal highs',
  },
] as const;

function pbGroupIdFor(kind: string | null): string {
  for (const g of PB_GROUPS) if (kind && (g.kinds as readonly string[]).includes(kind)) return g.id;
  return 'firsts';
}

/**
 * THE CATEGORY, PER CARD (BRIEF_DISCOVER_HIERARCHY §2.3). The three group names
 * did not disappear with the sub-headings — they moved onto the card they
 * describe, so a card explains itself on every surface it appears on.
 */
function pbCategoryLabel(kind: string | null, t: (k: string, d: string) => string): string | null {
  const id = pbGroupIdFor(kind);
  const def = PB_GROUPS.find((g) => g.id === id);
  return def ? t(def.key, def.label) : null;
}

/**
 * WHICH KINDS TAKE WHICH SECOND FIGURE (BRIEF_FEAT_SECOND_FIGURE §1-2). The
 * server decides WHETHER there is a figure; these sets decide only how it reads.
 * A kind in neither set shows the count alone.
 */
const DELTA_KINDS = new Set([
  'first_sub_70_here',
  'first_sub_80_here',
  'most_birdies_here',
  'most_pars_here',
]);
const WAIT_KINDS = new Set(['first_double_free_here']);

/** Eight tiles maximum, matching PAGE = 8 in AroundTheWorld (§3.2). */
const PAGE = 8;

/**
 * A RAIL, NOT A GRID (BRIEF_DISCOVER_HIERARCHY §3.2). This section is the
 * second tier and must not carry the same weight as the vertical anchor above
 * it: two vertical grids back to back is where the page was heaviest. A rail
 * says browsable rather than required.
 *
 * ONE CARD WIDTH AND ONE PHOTO HEIGHT — a rail with masonry heights reads as a
 * broken grid, so every card is identical and the eye runs sideways.
 */
const RAIL_CARD_W = 224;
const RAIL_PHOTO = 128;


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
   * REACTIONS (BRIEF_PERSONAL_BESTS_REACTIONS). ONE read for the whole section,
   * built from this section's own kept rows — never one per tile.
   *
   * The target is { type: 'round', id: whs_score_id }: IDENTICAL to Standout
   * Rounds and the friends rail, because content_reactions is canonical for
   * rounds. A round that appears in BOTH sections therefore SHARES one state —
   * react here and the heart fills there. That is the system working; do not
   * scope or namespace these targets to separate them.
   */
  const reactionTargets = useMemo<ReactionTarget[]>(
    () =>
      kept
        .filter((r) => !!r.whs_score_id)
        .map((r) => ({ type: 'round', id: r.whs_score_id }) as ReactionTarget),
    [kept],
  );
  const reactions = useContentReactions(reactionTargets);

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

  /**
   * THREE TREATMENTS, NONE PHOTOLESS AS A CLASS (BRIEF_FEAT_SECTIONS_HIERARCHY
   * §2). The axis is what the feat HAS, not how rare it is: a previous best
   * makes it a progression, an attempt count makes it an effort, and a feat with
   * neither keeps the full photograph it has today. Standout's rarity rules are
   * deliberately NOT applied here (§0 preamble).
   *
   * Every shape carries its own deterministic estimate (§0.1); the photo tile's
   * is unchanged.
   */
  const tiles = kept.map((r, i) => {
    const m = meta?.get(r.course_id);
    const photo = ATW_PHOTO_HEIGHTS[Math.min(i, ATW_PHOTO_HEIGHTS.length - 1)];
    const headline = r.headline ?? '';
    const reference = r.reference_line ?? null;
    const treatment = treatmentFor(r.feat_kind, reference);
    const previous = parsePreviousBest(r.feat_kind, reference);
    const attempts = parseAttempts(r.feat_kind, reference);
    const attemptPhrase =
      attempts !== null
        ? t('discover.pb.afterRounds', { defaultValue: 'After {{count}} rounds', count: attempts })
        : '';
    /**
     * THE SECOND FIGURE (BRIEF_FEAT_SECOND_FIGURE §1). Every kind that has an
     * honest comparison now carries it as a NUMBER on the row —
     * `second_figure` — and this file only decides which of the two treatments
     * it takes. It is NEVER parsed out of `reference_line`: a number read from
     * "Previous best 9" dies the moment that copy is edited or a locale renders
     * the sentence differently.
     *
     *   DELTA  a prior mark was beaten — green triangle plus figure.
     *   WAIT   nothing was beaten, but the rounds it took are the story —
     *          "After 52" in muted white.
     *
     * ONLY THE DELTA IS GREEN, and that is not a style preference. Green means
     * BETTER THAN BEFORE. A wait is neither better nor worse, so colouring it
     * would make green mean "interesting" — a meaning this app cannot afford
     * alongside under-par red and the viewing member's amber (§1.4).
     *
     * big_points_here, aces and albatrosses return NULL and show the count
     * alone: an invented figure would cheapen the real ones (§4).
     */
    const second = r.second_figure ?? null;
    const delta = DELTA_KINDS.has(r.feat_kind) && second != null && second > 0 ? second : null;
    const wait = WAIT_KINDS.has(r.feat_kind) && second != null && second > 0 ? second : null;
    /**
     * A ROW WITH A SECOND FIGURE TAKES THE GLASS CHIP, so the effort tile —
     * which draws the wait into a sentence and has no chip — is stood down for
     * those rows (§3.1). Rows with no second figure are untouched.
     */
    const chipped = delta != null || wait != null;

    const nameLen = (r.is_self ? 'You' : (r.display_name?.trim() ?? '')).length;
    const photoHeight =
      photo +
      23 +
      // The name row wraps to a second line instead of truncating, and the
      // detail row below it now carries the reaction control (20px floor).
      (nameLen ? Math.min(2, Math.ceil(nameLen / 19)) : 1) * 18 +
      2 + Math.max(Math.min(2, Math.ceil((headline?.length ?? 0) / 24)) * 16, 20) +
      (reference ? 3 + Math.min(2, Math.ceil(reference.length / 26)) * 14 : 0);

    return {
      r,
      m,
      photo,
      headline,
      reference,
      treatment,
      previous,
      attempts,
      attemptPhrase,
      delta,
      wait,
      chipped,
      slotKey: `${r.whs_score_id}:${r.feat_kind}`,
      // Deterministic height estimate, one per shape.
      height:
        treatment === 'effort' && !chipped
          ? estimateEffortHeight(`${headline} \u00B7 ${attemptPhrase}`)
          : photoHeight,
    };
  });


  const renderTile = (tt: (typeof tiles)[number]) => {
      const courseName =


                tt.m?.name ?? tt.r.course_name ?? t('discover.unknownCourse', 'Course');
              const who = tt.r.is_self
                ? t('discover.wire.you', 'You')
                : (tt.r.display_name?.trim() ?? '');
              const openRound = () => {
                if (onFeatPress && tt.r.whs_score_id) {
                  analyticsEvents.track('discover_personal_best_tap', {
                    feat: tt.r.feat_kind,
                    source: 'personal_bests',
                  });
                  onFeatPress(tt.r.whs_score_id, tt.r.user_id);
                  return;
                }
                onCoursePress(tt.r.course_id);
              };
              /* FIXED-WIDTH TRAILING SLOT — rendered whether or not a control
                 appears inside it, so member names never go ragged between a
                 tile with a reaction and one without. The heart's 44px tap
                 target is cancelled by a negative margin, so the WHO row
                 (billed at 18 in every shape) does not grow. */
              const trailing = (
                <ReactionSlot>
                  {tt.r.whs_score_id
                    ? (() => {
                        const st = reactions.stateFor('round', tt.r.whs_score_id);
                        return (
                          <ReactionAction
                            hidden={!reactions.viewerId || reactions.unavailable}
                            /* OWN FEAT: the count reads, the glyph is not
                               tappable. `is_self` comes from the RPC and is
                               never re-derived from the viewer id. */
                            readOnly={tt.r.is_self}
                            count={st.count}
                            reacted={st.mine}
                            /* Reserved count column so the glyph lands on the
                               same x down a column, reacted or not. */
                            reserveCount
                            onToggle={() => reactions.toggle('round', tt.r.whs_score_id)}
                            label={t('discover.reactions.action', 'Like this round')}
                          />
                        );
                      })()
                    : null}
                </ReactionSlot>
              );

              /* THE EFFORT TILE IS STOOD DOWN IN THE RAIL (§3.2): a rail of one
                 width and one photo height cannot carry a second anatomy. The
                 component itself is untouched. */
              if (false) {

                return (
                  <EffortTile
                    key={tt.slotKey}
                    courseId={tt.r.course_id}
                    courseName={courseName}
                    imageUrl={tt.m?.imageUrl ?? null}
                    who={who}
                    isOwn={tt.r.is_self}
                    whenLabel={relativeWhen(tt.r.play_date, t)}
                    figure={tt.r.figure}
                    unit={(tt.r.figure_unit ?? '').toUpperCase()}
                    headline={tt.headline}
                    attemptPhrase={tt.attemptPhrase}
                    attempts={tt.attempts}
                    avatarUrl={tt.r.profile_photo_url}
                    avatarUserId={tt.r.user_id}
                    trailing={trailing}
                    onPress={openRound}
                  />
                );
              }

              return (
              <StandoutTile
                key={tt.slotKey}
                courseId={tt.r.course_id}
                courseName={courseName}
                imageUrl={tt.m?.imageUrl ?? null}
                region={tt.m?.region ?? tt.r.region ?? null}
                photo={RAIL_PHOTO}
                figure={tt.r.figure}
                // THE UNIT IS NEVER HARDCODED (§3.4).
                unit={(tt.r.figure_unit ?? '').toUpperCase()}
                whenLabel={relativeWhen(tt.r.play_date, t)}
                who={who}
                isOwn={tt.r.is_self}
                detail={tt.headline}
                subline={tt.reference}
                /* THE CATEGORY, ON THE CARD (§2.3) — the three sub-headings are
                   gone, so each card names its own kind of best. */
                kicker={pbCategoryLabel(tt.r.feat_kind, t)}
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
                /* THE TAP OPENS THE ROUND (BRIEF_STANDOUT_TILE_TAP_AND_MORE
                   §2), the same sheet onDetailPress already opened. Only a row
                   with no round id falls back to the course page. */
                onPress={openRound}
                trailing={trailing}
                /* Positive only — most_pars_here / most_birdies_here fire only
                   when the previous best is beaten, so no red state exists
                   (§5.7). */
                delta={tt.delta}
                /* THE WAIT, WHITE NOT GREEN (§1.4). Only ever set when `delta`
                   is null — a chip holds one second figure. */
                wait={tt.wait}
                waitLabel={tt.wait != null ? t('discover.pb.after', 'After') : null}

                avatarUrl={tt.r.profile_photo_url}
                avatarUserId={tt.r.user_id}
              />
              );
  };

  return (
    <section>
      <Eyebrow
        tier={3}
        aside={<span style={LABEL}>{t('discover.last90', 'Last 90 days')}</span>}
      >
        {t('discover.personalBests', 'Personal bests')}
      </Eyebrow>

      {/* THE RAIL — bled to the page edge so a card is visibly cut off and
          the row reads as scrollable. No sub-headings (§2.2). */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          margin: '0 -14px',
          padding: '0 14px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {tiles.map((tt) => (
          <div
            key={tt.slotKey}
            style={{ width: RAIL_CARD_W, flex: 'none', scrollSnapAlign: 'start' }}
          >
            {renderTile(tt)}
          </div>
        ))}
      </div>
    </section>
  );

}

export default PersonalBests;
