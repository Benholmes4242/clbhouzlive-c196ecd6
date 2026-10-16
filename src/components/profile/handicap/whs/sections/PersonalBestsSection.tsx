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
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { useAllScores } from '@/lib/whs/hooks';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { formatDay2MonthYearShortGB } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsScore } from '@/lib/whs/types';

import { HcpSection } from './HcpSection';
import { pickCourse } from '@/lib/whs/pickCourse';
import { CHART } from '../charts';
import { differentialFromGross } from '@/lib/whs/coursePlay';

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

/** The handicap-native records, in their fixed order. */
const ORDER = ['gross', 'stableford', 'diff', 'vsHcp'] as const;
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
  /** Optional explanatory line (best-vs-course: why a higher gross ranks). */
  context?: string | null;
  /** Beat line; muted = the honest two-part line with no green rule. */
  beat: { text: string; muted: boolean } | null;
  /** The figure that beats it — shown right as "beat with {n}". Owner only. */
  beatN?: number | null;
  /** Replaces course in the meta line (against-handicap: "Off 3.3 that day"). */
  metaLead?: string | null;
}

interface Props {
  connectionId: string;
  /** The member's index now — used ONLY for the beat line of the
   *  against-handicap record (what it takes today). The record itself is
   *  scored off handicap_index_at_time. */
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
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

    // LOWEST SCORE: eighteen-hole rounds only — a nine-hole 43 would win by construction.
    const grossList = eighteen.filter(isReasonableGross).filter((s) => typeof s.adjusted_gross === 'number');
    if (grossList.length) {
      const best = grossList.reduce((a, b) => ((a.adjusted_gross as number) <= (b.adjusted_gross as number) ? a : b));
      out.push({
        key: 'gross',
        name: t('common:handicap.bests.bestGross'),
        figure: String(best.adjusted_gross),
        beat: isOwner
          ? { text: t('common:handicap.bests.beatGross', { score: (best.adjusted_gross as number) - 1 }), muted: false }
          : null,
        beatN: isOwner ? (best.adjusted_gross as number) - 1 : null,
        ...base(best),
      });
    }

    // BEST ROUND AGAINST THE COURSE: still ranked on the lowest DIFFERENTIAL; only what is printed
    // changes — the round's own adjusted gross. Known ambiguity: this is not
    // necessarily the lowest gross ever (an easy-course 66 can lose on the
    // differential). That is correct ranking; do not switch it to gross.
    if (diffList.length) {
      const best = diffList.reduce((a, b) =>
        (a.handicap_differential as number) <= (b.handicap_differential as number) ? a : b,
      );
      let beat: Row['beat'] = null;
      let beatN: number | null = null;
      if (isOwner && ref) {
        const record = best.handicap_differential as number;
        const diffOf = (g: number) => differentialFromGross(g, ref.cr, ref.slope);
        // CEIL MINUS ONE, never round: a rounded score can merely TIE the record.
        let score = Math.ceil((record * ref.slope) / 113 + ref.cr) - 1;
        while (diffOf(score) >= record) score -= 1;
        beat = { text: t('common:handicap.bests.beatRound', { score, course: ref.name }), muted: false };
        beatN = score;
      }
      out.push({
        key: 'diff',
        name: t('common:handicap.bests.bestVsCourse'),
        // THE FIGURE IS THE GROSS, and may read higher than Lowest score.
        // The context line explains it; do not reorder or print the differential.
        figure: String(best.adjusted_gross),
        context:
          best.course_rating != null && best.slope_rating
            ? t('common:handicap.bests.vsRating', {
                shots: (best.course_rating - (best.adjusted_gross as number)).toFixed(1),
                rating: best.course_rating.toFixed(1),
                slope: best.slope_rating,
              })
            : null,
        beat,
        beatN,
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
        beatN: isOwner ? (best.stableford_points as number) + 1 : null,
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
      let beatN: number | null = null;
      if (isOwner && ref && refPar != null && currentHandicap != null) {
        // gross - par - currentIndex < record
        const score = Math.ceil(refPar + currentHandicap + best.vsHcp) - 1;
        beatN = score;
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
        beatN,
        metaLead: t('common:handicap.bests.metaOff', { then: fmtIdx(best.then) }),
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
    t(`common:handicap.bests.lower.${k === 'diff' ? 'vsCourse' : k}`),
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
      heading={
        isFriend && ownerFirstName
          ? t('common:handicap.bests.headingFriend', { name: ownerFirstName })
          : t('common:handicap.bests.heading')
      }
    >
      {rows.map((r, i) => {
        /* TWO LINES (§5.2): name + one meta line left, figure + "beat with"
           right. SAME ROUND: a repeat score id drops its course. */
        const repeat = rows.slice(0, i).some((p) => p.id === r.id);
        const lead = repeat ? t('common:handicap.bests.sameRound') : r.metaLead ?? r.course;
        const sub = [lead, r.stood].filter(Boolean).join(' \u00b7 ');
        return (
          <div
            key={r.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${CHART.BORDER}`,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: CHART.INK, letterSpacing: '-0.01em' }}>
                {r.name}
              </div>
              {sub && (
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 10.5,
                    color: A.DIM,
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sub}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, color: CHART.INK, ...FIG }}>{r.figure}</div>
              {r.beatN != null && (
                <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 700, color: CHART.DOWN, whiteSpace: 'nowrap', ...FIG, letterSpacing: 0 }}>
                  {t('common:handicap.bests.beatWith', { n: r.beatN })}
                </div>
              )}
            </div>
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

    </HcpSection>
  );
};

export default PersonalBestsSection;
