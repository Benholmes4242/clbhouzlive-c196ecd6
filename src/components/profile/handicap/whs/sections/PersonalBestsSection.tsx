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
import { ChevronRight } from 'lucide-react';

import { useAllScores } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { isReasonableGross, isReasonableDiff } from '@/lib/whs/handicapMath';
import { formatDay2MonthYearShortGB } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsScore } from '@/lib/whs/types';

import { HcpSection } from './HcpSection';
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
  sub: string | null;
  figure: string;
}

interface Props {
  connectionId: string;
  currentHandicap: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  showTrophyRoom?: boolean;
}

/** total_holes is checked as well as the flag: both travel on every row. */
const isEighteen = (s: WhsScore) => !s.is_nine_hole && s.total_holes === 18;

function courseDate(s: WhsScore | null): string | null {
  if (!s) return null;
  const name = s.course?.name ?? null;
  const d = s.play_date ? formatDay2MonthYearShortGB(new Date(s.play_date)) : null;
  return [name, d].filter(Boolean).join(' \u00b7 ') || null;
}

export const PersonalBestsSection: React.FC<Props> = ({
  connectionId,
  viewMode = 'owner',
  ownerFirstName = null,
  showTrophyRoom = true,
}) => {
  const { t } = useTranslation(['common']);
  const { data: scores, isFetched } = useAllScores(connectionId);

  const rows = useMemo<Row[]>(() => {
    const list = scores ?? [];
    if (!list.length) return [];

    const out: Row[] = [];
    // Stableford and against-handicap: eighteen-hole rounds only.
    const eighteen = list.filter(isEighteen);
    const diffList = list.filter(isReasonableDiff);

    if (diffList.length) {
      const best = diffList.reduce((a, b) =>
        (a.handicap_differential as number) <= (b.handicap_differential as number) ? a : b,
      );
      out.push({
        key: 'diff',
        name: t('common:handicap.bests.bestDiff'),
        sub: courseDate(best),
        figure: fmtDiff(best.handicap_differential as number),
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
        sub: courseDate(best),
        figure: String(best.stableford_points),
      });
    }

    // Against handicap: each round is scored against the index it was played
    // off, as the provider recorded it — never the member's current index,
    // which would re-rank the whole record every time the index moves. As
    // with course par, a round missing the figure it needs is dropped rather
    // than scored against a guessed or current one.
    const scored = eighteen.filter(isReasonableGross).flatMap((s) =>
      typeof s.adjusted_gross === 'number' &&
      typeof s.course_par === 'number' &&
      typeof s.handicap_index_at_time === 'number'
        ? [{ s, vsHcp: s.adjusted_gross - s.course_par - s.handicap_index_at_time }]
        : [],
    );

    return ORDER.flatMap((k) => out.filter((r) => r.key === k));
  }, [scores, currentHandicap, t]);

  /* THE SENTENCE NAMES WHAT IS MISSING AND EXPLAINS NOTHING (Sep 2026 ruling).
     The old wording named a stableford and a round off handicap whatever was
     actually absent, so it was wrong whenever the missing record was another
     one. The list is generated from the same record names the rows use, so the
     two can never disagree. No instruction on how to set a record: the section
     is called Records to break. */
  const missingNames = ORDER.filter((k) => !rows.some((r) => r.key === k)).map((k) =>
    t(`common:handicap.bests.lower.${k}`),
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
      {rows.map((r, i) => (
        <div
          key={r.key}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            padding: '12px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${CHART.BORDER}`,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: CHART.INK, letterSpacing: '-0.01em' }}>
              {r.name}
            </div>
            {r.sub && (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color: CHART.DIM,
                  lineHeight: 1.35,
                  overflowWrap: 'anywhere',
                }}
              >
                {r.sub}
              </div>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: CHART.INK, flexShrink: 0, ...FIG }}>
            {r.figure}
          </div>
        </div>
      ))}

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
