/**
 * Course standing: every record held at one course, split by period, the
 * field it was held against, and the round each record came from.
 *
 * The field figure is data.fieldPlayers (distinct OTHER players, holder
 * excluded). The legacy fieldSizes map counts crown holders and must never
 * be read here. Unmeasured means silence, never zero.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { REC } from '../tokens';
import { Panel, BackLink, Kicker, Figure, RowButton, MetaLabel, Caption } from '../Primitives';
import { monthYear } from '../format';
import type { CourseCrownGroup } from '../panels/CrownsPanel';
import type { CareerData, Legend } from '../types';
import { medalTierTone } from '@/lib/tokens/medals';

interface Props {
  data: CareerData;
  group: CourseCrownGroup;
  onBack: () => void;
}

/** Period comes from the raw LegendCategory key, never the name or short label. */
const is90d = (r: Legend) => r.category.endsWith('_90d');

export const CrownDetail: React.FC<Props> = ({ data, group, onBack }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const others: number | undefined =
    data.fieldPlayersAvailable ? data.fieldPlayers?.get(group.courseId) : undefined;
  const fieldText =
    others === undefined
      ? null
      : others === 0
        ? 'First to post here'
        : `Held against ${others} other ${others === 1 ? 'member' : 'members'} who ${others === 1 ? 'has' : 'have'} posted here`;

  const blocks = [
    { label: 'ALL TIME', records: group.records.filter((r) => !is90d(r)) },
    { label: 'LAST 90 DAYS', records: group.records.filter(is90d) },
  ].filter((b) => b.records.length > 0);

  const count = group.records.length;

  return (
    <div style={{ fontFamily: REC.FONT }}>
      <BackLink label="Back to the record" onClick={onBack} />
      <Kicker>COURSE STANDING</Kicker>
      <h3 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: REC.INK }}>
        {group.courseName}
      </h3>

      <div
        style={{
          marginTop: 12,
          border: `1px solid ${REC.AMBER_LINE}`,
          background: REC.AMBER_WASH,
          borderRadius: 14,
          padding: '14px 15px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center',
            background: medalTierTone('gold'), color: REC.CANVAS,
          }}
        >
          <Crown size={22} strokeWidth={2.25} />
        </span>
        <div>
          <div style={{ lineHeight: 1 }}>
            <Figure value={count} size={30} color={REC.INK} />
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: REC.MUTE }}>
            {count === 1 ? 'record held here' : 'records held here'}
          </div>
        </div>
      </div>
      {fieldText && (
        <div style={{ marginTop: 8 }}>
          <Caption>{fieldText}</Caption>
        </div>
      )}

      <div style={{ height: 12 }} />

      {blocks.map((block) => (
        <Panel key={block.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <MetaLabel>{block.label}</MetaLabel>
            <MetaLabel>{block.records.length}</MetaLabel>
          </div>
          {block.records.map((record, i) => (
            <RowButton
              key={record.id}
              last={i === block.records.length - 1}
              onClick={() => setExpanded((prev) => (prev === record.id ? null : record.id))}
              ariaLabel={record.name}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: REC.INK }}>
                  {record.name}
                </span>
                <Figure value={record.formattedValue} size={16} color={REC.INK} />
              </div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: REC.MUTE, ...REC.TABULAR }}>
                Held since {monthYear(record.attainedAt)}
              </div>
              {expanded === record.id && others !== undefined && (
                <div style={{ marginTop: 8 }}>
                  <MetaLabel>
                    {others > 0
                      ? `BEST OF ${others + 1} MEMBERS HERE`
                      : 'NO OTHER MEMBER HAS POSTED HERE YET'}
                  </MetaLabel>
                </div>
              )}
            </RowButton>
          ))}
        </Panel>
      ))}

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
