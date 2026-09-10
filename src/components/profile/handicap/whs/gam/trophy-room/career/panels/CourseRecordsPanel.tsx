/**
 * COURSE RECORDS -- the section this rebuild exists for.
 *
 * THE MEASUREMENT: 2,916 current records across 22 members and 255 courses.
 * 857 (29%) are at courses ONE person has played. 154 of 255 courses are
 * single-player; 17 are contested. So one combined total counts a record won
 * against five golfers and a record held because nobody else has been there as
 * the same thing, and that is the only fault worth fixing on this sheet.
 *
 * TWO FIGURES, NEVER ONE. WON in ink, UNCONTESTED in T40. The definition line
 * states the rule in words directly beneath them, because a member reading
 * "uncontested" without it will read an accusation.
 *
 * THE TWO FIGURES COUNT RECORDS, NOT COURSES (ruled 10 Sep 2026). They sum to
 * the same total the sheet showed before the split -- 67 for member 8c240997 --
 * so the headline keeps continuity with the figure the member already knows and
 * answers "of my sixty-seven records, how many did I actually win?". WON = 10
 * records at the 4 courses with FIELD_MIN_PLAYERS+ other golfers; UNCONTESTED =
 * 57 at the other 18. The COURSE count stays in the meta ("{n} courses") and
 * must never move into the headline: a courses split would shrink the figure
 * from 67 to 22 for reasons that have nothing to do with contest.
 *
 * THE THRESHOLD IS NOT LOCAL, AND IT IS NOT THE FIELD THRESHOLD. Contested here
 * means CROWN_MIN_OTHERS (1) or more distinct players with a scored round at the
 * course EXCLUDING the holder. That is deliberately NOT the scorecard's
 * FIELD_MIN_PLAYERS (5): a field row gates an AVERAGE, a record gates a CONTEST,
 * and one other golfer on the board is a contest you won. Both constants and the
 * reason they differ live in src/lib/gam/fieldGate.ts. The player COUNT is
 * shared with the scorecard; only the floor differs. No second player count is
 * computed here: when the batched read is unavailable the section states record
 * counts and NOTHING about contest.
 *
 * A ZERO from that read may mean "not mapped", not "nobody else has played".
 * Both are uncontested so this section is safe; nothing else may reuse the zero.
 *
 * SORT: contested first by record count descending, uncontested after, also by
 * count. A member should see what they won before what they claimed.
 *
 * REPLACES CrownsPanel, which stays on disk on the dead list.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { REC, LABEL } from '../tokens';
import { Panel, RowButton, Figure, Collapsible, MetaLabel } from '../Primitives';
import { CROWN_MIN_OTHERS, hasContest, hasField } from '@/lib/gam/fieldGate';
import type { CourseCrownGroup } from './CrownsPanel';
import type { CareerData } from '../types';

interface Props {
  data: CareerData;
  groups: CourseCrownGroup[];
}

/**
 * A row's contest state. `unknown` = the batched field read is unavailable.
 *
 * FOUR COPY BANDS, UNCHANGED: alone / one / few (2-4) / won (5+) each keep their
 * own sentence, because the SIZE of a contest is worth showing. What changed is
 * which of them counts as WON in the headline: everything except `alone`.
 */
type Contest =
  | { kind: 'unknown' }
  | { kind: 'won'; others: number }
  | { kind: 'few'; others: number }
  | { kind: 'one' }
  | { kind: 'alone' };

export function contestOf(
  others: number | undefined,
  available: boolean,
): Contest {
  if (!available || others === undefined) return { kind: 'unknown' };
  if (hasField(others)) return { kind: 'won', others };
  if (others < CROWN_MIN_OTHERS) return { kind: 'alone' };
  if (others === 1) return { kind: 'one' };
  return { kind: 'few', others };
}

/** WON in the headline: a record beaten somebody. Only `alone` is uncontested. */
const isWon = (c: Contest): boolean =>
  c.kind === 'won' || c.kind === 'few' || c.kind === 'one';

export const CourseRecordsPanel: React.FC<Props> = ({ data, groups }) => {
  const { t } = useTranslation('handicap');
  // Nothing held: the section does not render. No zeros, no empty state -- and
  // on today's population no connected member is in this state anyway.
  if (groups.length === 0) return null;

  const available = data.fieldPlayersAvailable === true;
  const rows = groups.map((group) => ({
    group,
    contest: contestOf(data.fieldPlayers?.get(group.courseId), available),
  }));

  // Contested first, each band by record count descending, then by name so the
  // order is stable between renders.
  const rank = (c: Contest) => (isWon(c) ? 0 : 1);
  const ordered = [...rows].sort((a, b) => {
    if (rank(a.contest) !== rank(b.contest)) return rank(a.contest) - rank(b.contest);
    if (b.group.records.length !== a.group.records.length)
      return b.group.records.length - a.group.records.length;
    return a.group.courseName.localeCompare(b.group.courseName);
  });

  const won = rows
    .filter((r) => isWon(r.contest))
    .reduce((sum, r) => sum + r.group.records.length, 0);
  const uncontested = rows
    .filter((r) => r.contest.kind === 'alone')
    .reduce((sum, r) => sum + r.group.records.length, 0);
  const total = rows.reduce((sum, r) => sum + r.group.records.length, 0);

  const subLine = (c: Contest): string | null => {
    if (c.kind === 'won') return t('career.recordsWonAgainst', { n: c.others });
    if (c.kind === 'few') return t('career.recordsFewOthers', { n: c.others });
    if (c.kind === 'one') return t('career.recordsOneOther');
    if (c.kind === 'alone') return t('career.recordsNobodyElse');
    return null;
  };

  return (
    <Panel
      title={t('career.recordsKicker')}
      action={<MetaLabel>{t('career.recordsCourses', { n: groups.length })}</MetaLabel>}
    >
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${REC.BORDER}` }}>
        {available ? (
          <>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ ...LABEL, fontFamily: REC.FONT }}>{t('career.recordsWon')}</div>
                <div style={{ marginTop: 4 }}>
                  <Figure value={won} size={21} color={REC.INK} />
                </div>
              </div>
              <div>
                <div style={{ ...LABEL, fontFamily: REC.FONT }}>
                  {t('career.recordsUncontested')}
                </div>
                <div style={{ marginTop: 4 }}>
                  <Figure value={uncontested} size={21} color={REC.DIM} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.55, color: REC.MUTE }}>
              {t('career.recordsDefinition')}
            </div>
          </>
        ) : (
          <>
            {/* No field read: the total is stated and no course is called won or
                uncontested. Stating a split we cannot measure is the fault. */}
            <div style={{ ...LABEL, fontFamily: REC.FONT }}>{t('career.recordsHeld')}</div>
            <div style={{ marginTop: 4 }}>
              <Figure value={total} size={21} color={REC.INK} />
            </div>
            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.55, color: REC.MUTE }}>
              {t('career.recordsNoFieldData')}
            </div>
          </>
        )}
      </div>

      <Collapsible
        showAllLabel={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {t('career.recordsSeeAll', { n: groups.length })}
            <ChevronRight size={13} strokeWidth={2.4} />
          </span>
        }
        showFewerLabel={t('career.showFewer')}
      >
        {ordered.map(({ group, contest }, i) => {
          const contested = contest.kind === 'won';
          const sub = subLine(contest);
          return (
            <RowButton
              key={group.key}
              last={i === ordered.length - 1}
              onClick={() => data.onOpen({ kind: 'crown', courseKey: group.key })}
              ariaLabel={`${group.courseName}, ${group.records.length} records`}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: REC.INK }}
                >
                  {group.courseName}
                </span>
                <Figure
                  value={group.records.length}
                  size={16}
                  color={contested ? REC.INK : REC.DIM}
                />
              </div>
              {sub ? (
                <div style={{ marginTop: 5, fontSize: 11, color: REC.DIM, ...REC.TABULAR }}>
                  {sub}
                </div>
              ) : null}
            </RowButton>
          );
        })}
      </Collapsible>
    </Panel>
  );
};

export { CROWN_MIN_OTHERS, hasContest };
export default CourseRecordsPanel;
