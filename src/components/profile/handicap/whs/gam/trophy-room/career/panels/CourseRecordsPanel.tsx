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
 * answers "of my sixty-seven records, how many did I actually win?". WON = 49
 * records at the 19 courses where at least one other golfer has played;
 * UNCONTESTED = 18 at the 3 where nobody has. The COURSE count stays in the
 * meta ("{n} courses") and
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
 * THREE COPY BANDS, NOT FOUR: nobody else / one other / 2+ others. The 2-4 and
 * 5+ bands collapse because under the new rule they are the same thing -- a
 * contest -- and the number carries how big it was. A row that counts as WON
 * opens with "Won against", never "Only". Won rows render in INK; nobody-else
 * rows render in T40.
 *
 * BRIEF_TROPHY_ROOM_B5_STRICT_WON SUPERSEDES the field-player contest rule
 * above: WON / UNCONTESTED now come only from get_member_record_split, the
 * Course Legend badge's per-board rule, and attendance boards count in neither.
 *
 * REPLACES CrownsPanel, which stays on disk on the dead list.
 */
import { recordsWonFrom } from '@/hooks/gam/useMemberRecordSplit';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { REC, FIGURE } from '../tokens';
import { Panel, Collapsible, MetaLabel } from '../Primitives';
import type { CourseCrownGroup } from './CrownsPanel';
import type { CareerData } from '../types';

interface Props {
  data: CareerData;
  groups: CourseCrownGroup[];
}

/**
 * Attendance boards: not records, counted in neither figure. CLIENT COPY of
 * TENURE_CATEGORIES in supabase/functions/gam-evaluator/legendTitles.ts, which
 * is the source; keep the two in step.
 */
export const TENURE_CATEGORIES: ReadonlySet<string> = new Set([
  'most_rounds_all_time',
  'most_birdies_all_time',
]);

/**
 * ONE source for the record split. The panel aside and the cabinet's RECORDS
 * tile both read this, so the two figures cannot disagree. Reads ONLY
 * data.recordSplitByCourse; when unavailable it states a total and no split.
 */
export function recordSplit(
  data: CareerData,
  groups: CourseCrownGroup[],
): { available: boolean; won: number; uncontested: number; total: number } {
  const available = data.recordSplitAvailable;
  if (!available) {
    let total = 0;
    for (const g of groups) {
      for (const r of g.records) if (!TENURE_CATEGORIES.has(String(r.category))) total += 1;
    }
    return { available, won: 0, uncontested: 0, total };
  }
  const won = recordsWonFrom(data.recordSplitByCourse);
  let uncontested = 0;
  for (const s of data.recordSplitByCourse.values()) uncontested += s.sole;
  return { available, won, uncontested, total: won + uncontested };
}

export const CourseRecordsPanel: React.FC<Props> = ({ data, groups }) => {
  const { t } = useTranslation('handicap');

  const { available, won, uncontested, total } = recordSplit(data, groups);

  // Split unavailable (RPC errored): rows come from `groups`, counting
  // non-attendance records. Carried as contested with sole 0 so the row is
  // neither dimmed nor noted; the sort reduces to count desc, then name.
  const rows = groups
    .map((group) => {
      if (!available) {
        const n = group.records.filter((r) => !TENURE_CATEGORIES.has(String(r.category))).length;
        return { group, contested: n, sole: 0 };
      }
      const s = data.recordSplitByCourse.get(group.courseId);
      return { group, contested: s?.contested ?? 0, sole: s?.sole ?? 0 };
    })
    .filter((r) => r.contested + r.sole > 0)
    .sort(
      (a, b) =>
        b.contested - a.contested ||
        b.sole - a.sole ||
        a.group.courseName.localeCompare(b.group.courseName),
    );
  if (rows.length === 0 && total === 0) return null;

  return (
    <Panel
      title={t('career.recordsKicker')}
      action={
        <MetaLabel>
          {available
            ? t('career.recordsWonUncontested', { won, uncontested })
            : t('career.recordsTotalHeld', { total })}
        </MetaLabel>
      }
    >
      <Collapsible
        showAllLabel={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {t('career.recordsSeeAll', { n: rows.length })}
            <ChevronRight size={13} strokeWidth={2.4} />
          </span>
        }
        showFewerLabel={t('career.showFewer')}
      >
        {rows.map(({ group, contested, sole }, i) => {
          const dim = contested === 0;
          const count = dim ? sole : contested;
          const note = dim
            ? { text: t('career.recordsNobodyElseYet'), color: REC.DIM }
            : sole > 0
              ? { text: t('career.recordsPlusUncontested', { n: sole }), color: REC.INK_50 }
              : null;
          return (
            <button
              type="button"
              key={group.key}
              onClick={() => data.onOpen({ kind: 'crown', courseKey: group.key })}
              aria-label={`${group.courseName}, ${count} records`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                width: '100%',
                padding: '13px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${REC.BORDER}`,
                textAlign: 'left',
                fontFamily: REC.FONT,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: dim ? REC.DIM : REC.INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.courseName}
              </span>
              {note ? (
                <span style={{ fontSize: 11.5, color: note.color, whiteSpace: 'nowrap', ...REC.TABULAR }}>
                  {note.text}
                </span>
              ) : null}
              <span
                style={{
                  ...FIGURE,
                  fontSize: 16,
                  width: 26,
                  textAlign: 'right',
                  flexShrink: 0,
                  color: dim ? REC.DIM : REC.INK,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </Collapsible>
    </Panel>
  );
};

export default CourseRecordsPanel;
