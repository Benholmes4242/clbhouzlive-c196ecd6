/**
 * COURSE CROWNS -- records held at a course, grouped by course.
 *
 * A crown at a course only one member has posted at is being first through
 * the door, and the row says so. Contested crowns state the field they were
 * held against. Field size comes from the legends view, not from an assertion.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { Panel, RowButton, Figure, Collapsible, MetaLabel } from '../Primitives';
import { plural } from '../format';
import type { CareerData, Legend } from '../types';

export interface CourseCrownGroup {
  key: string;
  courseId: string;
  courseName: string;
  records: Legend[];
}

export function groupCrowns(legends: Legend[]): CourseCrownGroup[] {
  const map = new Map<string, CourseCrownGroup>();
  for (const item of legends) {
    const key = item.courseId || `name:${item.courseName}`;
    const existing = map.get(key);
    if (existing) existing.records.push(item);
    else
      map.set(key, {
        key,
        courseId: item.courseId,
        courseName: item.courseName,
        records: [item],
      });
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.records.length !== a.records.length) return b.records.length - a.records.length;
    return a.courseName.localeCompare(b.courseName);
  });
}

/** Copy is deliberate: "first to post here" states the fact without a jab. */
export function fieldLine(fieldSize: number | undefined): string {
  if (!fieldSize || fieldSize <= 1) return 'First to post here';
  return `Held against ${fieldSize} ${plural(fieldSize, 'member', 'members')} who have posted a round here`;
}

interface Props {
  data: CareerData;
  groups: CourseCrownGroup[];
}

export const CrownsPanel: React.FC<Props> = ({ data, groups }) => {
  const { t } = useTranslation('handicap');
  // Nothing held: the panel does not render at all. No zeros, no empty state.
  if (groups.length === 0) return null;
  const totalRecords = groups.reduce((sum, g) => sum + g.records.length, 0);
  return (
    <Panel
      title="COURSE CROWNS"
      // The aside states the FULL total, so collapsing never hides the headline.
      action={
        <MetaLabel>
          {totalRecords} {plural(totalRecords, 'RECORD', 'RECORDS')} AT {groups.length}{' '}
          {plural(groups.length, 'COURSE', 'COURSES')}
        </MetaLabel>
      }
    >
      <Collapsible
        showAllLabel={t('career.showAll', { count: groups.length })}
        showFewerLabel={t('career.showFewer')}
      >
        {groups.map((group, i) => {
          const fieldSize = data.fieldSizes.get(group.courseId);
          return (
            <RowButton
              key={group.key}
              last={i === groups.length - 1}
              onClick={() => data.onOpen({ kind: 'crown', courseKey: group.key })}
              ariaLabel={`${group.courseName}, ${group.records.length} records`}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: REC.INK }}
                >
                  {group.courseName}
                </span>
                <span style={{ ...REC.TABULAR, fontSize: 11.5, color: REC.MUTE }}>
                  <Figure value={group.records.length} size={18} color={REC.AMBER} />{' '}
                  {plural(group.records.length, 'record', 'records')}
                </span>
              </div>
              <div style={{ marginTop: 5, fontSize: 11.5, color: REC.MUTE, ...REC.TABULAR }}>
                {fieldLine(fieldSize)}
              </div>
            </RowButton>
          );
        })}
      </Collapsible>
    </Panel>
  );
};

export default CrownsPanel;
