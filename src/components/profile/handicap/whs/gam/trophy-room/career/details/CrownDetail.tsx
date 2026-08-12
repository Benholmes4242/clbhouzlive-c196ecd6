/**
 * Crown detail: every record held at one course, the field it was held
 * against, and the round each record came from.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REC } from '../tokens';
import { Panel, BackLink, Kicker, Caption, Figure, RowButton, MetaLabel } from '../Primitives';
import { monthYear } from '../format';
import { fieldLine, type CourseCrownGroup } from '../panels/CrownsPanel';
import type { CareerData } from '../types';

interface Props {
  data: CareerData;
  group: CourseCrownGroup;
  onBack: () => void;
}

export const CrownDetail: React.FC<Props> = ({ data, group, onBack }) => {
  const navigate = useNavigate();
  const fieldSize = data.fieldSizes.get(group.courseId);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: REC.FONT }}>
      <BackLink label="Back to the record" onClick={onBack} />
      <Kicker>COURSE CROWN</Kicker>
      <h3
        style={{
          margin: '8px 0 0',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: REC.INK,
        }}
      >
        {group.courseName}
      </h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 6px' }}>
        <Figure value={group.records.length} size={34} color={REC.AMBER} />
        <span style={{ fontSize: 13, color: REC.MUTE }}>
          {group.records.length === 1 ? 'record held here' : 'records held here'}
        </span>
      </div>
      <Caption>{fieldLine(fieldSize)}</Caption>

      <div style={{ height: 12 }} />

      <Panel title="RECORDS">
        {group.records.map((record, i) => (
          <RowButton
            key={record.id}
            last={i === group.records.length - 1}
            onClick={() => setExpanded((prev) => (prev === record.id ? null : record.id))}
            ariaLabel={record.name}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: REC.INK }}>
                {record.name}
              </span>
              <Figure value={record.formattedValue} size={16} color={REC.AMBER} />
            </div>
            <div style={{ marginTop: 4, fontSize: 11.5, color: REC.MUTE, ...REC.TABULAR }}>
              Held since {monthYear(record.attainedAt)}
            </div>
            {expanded === record.id && (
              <div style={{ marginTop: 8 }}>
                <MetaLabel>
                  {fieldSize && fieldSize > 1
                    ? `BEST OF ${fieldSize} MEMBERS HERE`
                    : 'NO OTHER MEMBER HAS POSTED HERE YET'}
                </MetaLabel>
              </div>
            )}
          </RowButton>
        ))}
      </Panel>

      {group.courseId && (
        <Panel>
          <RowButton onClick={() => navigate(`/courses/${group.courseId}`)} last>
            <MetaLabel color={REC.AMBER}>OPEN {group.courseName.toUpperCase()}</MetaLabel>
          </RowButton>
        </Panel>
      )}
    </div>
  );
};

export default CrownDetail;
