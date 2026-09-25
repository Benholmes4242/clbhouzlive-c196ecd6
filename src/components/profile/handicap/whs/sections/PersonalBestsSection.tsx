/**
 * PersonalBestsSection — SECTION H of the one-page handicap brief.
 *
 * Flat replacement for records/PersonalBests: no panel, no radius, no tint,
 * 1px hairline between rows and none above the first.
 *
 * A ROW RENDERS ONLY WHERE THE RECORD EXISTS. No zero rows, no em-dash rows,
 * no placeholders holding a slot for a record nobody has set. When rows are
 * missing, one sentence says which and why, and it counts them.
 *
 * MOST ROUNDS IN A MONTH IS GONE (a removed row, not a removed file). Volume is not a
 * personal best: it rewards playing more rather than playing better, and in a
 * list of scoring records it reads as one of them.
 *
 * NINE-HOLE ROUNDS ARE EXCLUDED FROM STABLEFORD AND AGAINST HANDICAP, and the exclusion is
 * NOT captioned — a record is a record, and "eighteen-hole" printed on one
 * reads as a qualification on the achievement rather than on the method. A
 * nine-hole gross is roughly half an eighteen-hole gross, so unfiltered it
 * would win by construction (a 43 beats a 68 every time). Differential and
 * against-handicap are already normalised to eighteen holes by WHS and are left
 * alone.
 *
 * THE TROPHY ROOM ROW calls openGamAchievements() — the SAME handler
 * AchievementsPanel's tile calls. No new route, no second implementation, so
 * ?gam=trophies, &section=crowns and &badge=<id> keep resolving.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ChevronRight } from 'lucide-react';

import { useAllScores } from '@/lib/whs/hooks';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { formatDay2MonthYearShortGB } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsScore } from '@/lib/whs/types';

import { HcpSection } from './HcpSection';
import { pickCourse } from './NextRoundSection';
import { CHART } from '../charts';
import { openGamAchievements } from '../gam/events';

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

/** The handicap-native records, in their fixed order. */
const ORDER = ['diff', 'stableford', 'vsHcp'] as const;
type RecordKey = (typeof ORDER)[number];

interface Row {
  key: RecordKey;
  name: string;
  /** Score id — the same-round comparison is on id, never name/date. */
  id: string;
  course: string | null;
  date: string | null;
  stood: string | null;
  figure: string;
  /** Beat line; muted = the honest two-part line with no green rule. */
  beat: { text: string; muted: boolean } | null;
}

interface Props {
  connectionId: string;
  /** The member's index now — used ONLY for the beat line of the
   *  against-handicap record (what it takes today). The record itself is
   *  scored off handicap_index_at_time. */
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  showTrophyRoom?: boolean;
}

/** total_holes is checked as well as the flag: both travel on every row. */
const isEighteen = (s: WhsScore) => !s.is_nine_hole && s.total_holes === 18;

const fmtIdx = (n: number) => (n < 0 ? `+${Math.abs(n).toFixed(1)}` : n.toFixed(1));

/** How long a record has stood, from play_date alone. */
function stoodFor(playDate: string | null | undefined, t: TFunction): string | null {
  if (!playDate) return null;
  const then = new Date(playDate);
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86400000));
  if (days < 56) {
    const w = Math.max(1, Math.floor(days / 7));
    return w === 1
      ? t('common:handicap.bests.stoodWeeksOne')
      : t('common:handicap.bests.stoodWeeksOther', { count: w });
  }
  let months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  if (now.getDate() < then.getDate()) months -= 1;
  months = Math.max(1, months);
  if (months < 18) {
    return months === 1
      ? t('common:handicap.bests.stoodMonthsOne')
      : t('common:handicap.bests.stoodMonthsOther', { count: months });
  }
  return t('common:handicap.bests.stoodYears', { years: Math.floor(months / 12), months: months % 12 });
}

export const PersonalBestsSection: React.FC<Props> = ({
  connectionId,
  currentHandicap,
  viewMode = 'owner',
  ownerFirstName = null,
  showTrophyRoom = true,
}) => {
  const { t } = useTranslation(['common']);
  const { data: scores, isFetched } = useAllScores(connectionId);
  const isOwner = viewMode === 'owner';

  const rows = useMemo<Row[]>(() => {
    const list = scores ?? [];
    if (!list.length) return [];

    // Reference course: the SAME pick as Next round, so the two agree.
    const window20 = list.slice(0, 20);
    const ref = pickCourse(window20);
    const refPar =
      ref ? window20.find((r) => r.course_id === ref.id && typeof r.course_par === 'number')?.course_par ?? null : null;

    const base = (s: WhsScore) => ({
      id: s.id,
      course: s.course?.name ?? null,
      date: s.play_date ? formatDay2MonthYearShortGB(new Date(s.play_date)) : null,
      stood: stoodFor(s.play_date, t),
    });

    const out: Row[] = [];
    const eighteen = list.filter(isEighteen);
    const diffList = list.filter(isReasonableDiff).filter((s) => typeof s.adjusted_gross === 'number');

    // BEST ROUND: still ranked on the lowest DIFFERENTIAL; only what is printed
    // changes — the round's own adjusted gross. Known ambiguity: this is not
    // necessarily the lowest gross ever (an easy-course 66 can lose on the
    // differential). That is correct ranking; do not switch it to gross.
    if (diffList.length) {
      const best = diffList.reduce((a, b) =>
        (a.handicap_differential as number) <= (b.handicap_differential as number) ? a : b,
      );
      let beat: Row['beat'] = null;
      if (isOwner && ref) {
        const record = best.handicap_differential as number;
        const diffOf = (g: number) => ((g - ref.cr) * 113) / ref.slope;
        // CEIL MINUS ONE, never round: a rounded score can merely TIE the record.
        let score = Math.ceil((record * ref.slope) / 113 + ref.cr) - 1;
        while (diffOf(score) >= record) score -= 1;
        beat = { text: t('common:handicap.bests.beatRound', { score, course: ref.name }), muted: false };
      }
      out.push({
        key: 'diff',
        name: t('common:handicap.bests.bestRound'),
        figure: String(best.adjusted_gross),
        beat,
        ...base(best),
      });
    }

    const stableList = eighteen.filter((s) => s.stableford_points != null && s.stableford_points > 0);
    if (stableList.length) {
      const best = stableList.reduce((a, b) =>
        (a.stableford_points as number) >= (b.stableford_points as number) ? a : b,
      );
      out.push({
        key: 'stableford',
        name: t('common:handicap.bests.bestStableford'),
        figure: String(best.stableford_points),
        beat: isOwner
          ? { text: t('common:handicap.bests.beatStableford', { points: (best.stableford_points as number) + 1 }), muted: false }
          : null,
        ...base(best),
      });
    }

    // Against handicap: each round is scored against the index it was played
    // off, as the provider recorded it — never the member's current index,
    // which would re-rank the whole record every time the index moves. A round
    // missing the figure it needs is dropped rather than scored against a guess.
    const scored = eighteen.filter(isReasonableGross).flatMap((s) =>
      typeof s.adjusted_gross === 'number' &&
      typeof s.course_par === 'number' &&
      typeof s.handicap_index_at_time === 'number'
        ? [{ s, then: s.handicap_index_at_time, vsHcp: s.adjusted_gross - s.course_par - s.handicap_index_at_time }]
        : [],
    );

    if (scored.length) {
      const best = scored.reduce((a, b) => (a.vsHcp <= b.vsHcp ? a : b));
      const abs = Math.abs(best.vsHcp).toFixed(1);
      let beat: Row['beat'] = null;
      if (isOwner && ref && refPar != null && currentHandicap != null) {
        // gross - par - currentIndex < record
        const score = Math.ceil(refPar + currentHandicap + best.vsHcp) - 1;
        beat =
          Math.abs(best.then - currentHandicap) <= 0.5
            ? { text: t('common:handicap.bests.beatRound', { score, course: ref.name }), muted: false }
            : {
                // A record set off a much higher index is near-unbeatable now;
                // say so rather than dress it as achievable.
                text: t('common:handicap.bests.beatVsHcp', {
                  then: fmtIdx(best.then),
                  now: fmtIdx(currentHandicap),
                  score,
                  course: ref.name,
                }),
                muted: true,
              };
      }
      out.push({
        key: 'vsHcp',
        name: t('common:handicap.bests.bestVsHcp'),
        // True minus, never a hyphen.
        figure: best.vsHcp < 0 ? `\u2212${abs}` : best.vsHcp > 0 ? `+${abs}` : abs,
        beat,
        ...base(best.s),
      });
    }

    return ORDER.flatMap((k) => out.filter((r) => r.key === k));
  }, [scores, t, isOwner, currentHandicap]);

  /* THE SENTENCE NAMES WHAT IS MISSING AND EXPLAINS NOTHING (Sep 2026 ruling).
     The old wording named a stableford and a round off handicap whatever was
     actually absent, so it was wrong whenever the missing record was another
     one. The list is generated from the same record names the rows use, so the
     two can never disagree. No instruction on how to set a record: the section
     is called Records to break. */
  const missingNames = ORDER.filter((k) => !rows.some((r) => r.key === k)).map((k) =>
    t(`common:handicap.bests.lower.${k === 'diff' ? 'round' : k}`),
  );

  const fired = useRef(false);
  useEffect(() => {
    if (!isFetched || fired.current) return;
    fired.current = true;
    if (rows.length === 0) {
      analyticsEvents.track('handicap_section_withheld', {
        section: 'personal_bests',
        records: 0,
      });
    }
  }, [isFetched, rows.length]);

  // Nothing renders while the scores are in flight — no skeleton, no jump.
  if (!isFetched) return null;

  const isFriend = viewMode === 'friend';

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.bests.eyebrow')}
      heading={
        isFriend && ownerFirstName
          ? t('common:handicap.bests.headingFriend', { name: ownerFirstName })
          : t('common:handicap.bests.heading')
      }
    >
      {rows.map((r, i) => {
        // SAME ROUND: the second row sharing a score id drops its course · date.
        const repeat = rows.slice(0, i).some((p) => p.id === r.id);
        const sub = (repeat
          ? [t('common:handicap.bests.sameRound'), r.stood]
          : [r.course, r.date, r.stood]
        ).filter(Boolean).join(' \u00b7 ');
        return (
          <div
            key={r.key}
            style={{
              padding: '16px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${CHART.BORDER}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1, fontSize: 15, fontWeight: 600, color: CHART.INK, letterSpacing: '-0.01em' }}>
                {r.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: CHART.INK, flexShrink: 0, ...FIG }}>
                {r.figure}
              </div>
            </div>
            {sub && (
              <div style={{ marginTop: 4, fontSize: 12, color: CHART.MUTE, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                {sub}
              </div>
            )}
            {r.beat && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'stretch', gap: 8 }}>
                {!r.beat.muted && (
                  <span aria-hidden style={{ width: 3, flexShrink: 0, background: CHART.DOWN, borderRadius: 1 }} />
                )}
                <span style={{ fontSize: 13, lineHeight: 1.45, color: r.beat.muted ? CHART.MUTE : CHART.INK }}>
                  {r.beat.text}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Never a section with no rows and no sentence. */}
      {missingNames.length > 0 && (
        <div
          style={{
            marginTop: rows.length ? 12 : 0,
            fontSize: 12,
            color: CHART.DIM,
            lineHeight: 1.5,
          }}
        >
          {t('common:handicap.bests.stillToSet', { list: missingNames.join(', ') })}
        </div>
      )}

      {/* TERMINAL ROW — same handler as the AchievementsPanel tile. */}
      {!isFriend && showTrophyRoom && <TrophyRoomRow />}
    </HcpSection>
  );
};

export const TrophyRoomRow: React.FC<{ standalone?: boolean }> = ({ standalone = false }) => {
  const { t } = useTranslation(['common']);
  const row = (
    <button
      type="button"
      onClick={() => openGamAchievements()}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: standalone ? 0 : '14px 0 0',
        marginTop: standalone ? 0 : 12,
        background: 'none',
        border: 'none',
        borderTopStyle: standalone ? 'none' : 'solid',
        borderTopWidth: standalone ? 0 : 1,
        borderTopColor: CHART.BORDER,
        color: CHART.MUTE,
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.19em',
          textTransform: 'uppercase',
        }}
      >
        {t('common:handicap.bests.trophyRoom')}
      </span>
      <ChevronRight size={14} strokeWidth={2.4} color={CHART.MUTE} />
    </button>
  );

  return standalone ? <HcpSection hairline>{row}</HcpSection> : row;
};

export default PersonalBestsSection;
