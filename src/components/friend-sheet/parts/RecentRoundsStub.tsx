import React from 'react';
import { Activity } from 'lucide-react';
import { Eyebrow } from './_shared/Eyebrow';
import { FONT, BG_1, T100, T60, T40, LINE } from './_shared/tokens';

interface Props {
  lastRound: { courseName: string; relativeTime: string } | null;
}

export const RecentRoundsStub: React.FC<Props> = ({ lastRound }) => (
  <div style={{ padding: '4px 20px 14px', fontFamily: FONT }}>
    <Eyebrow label="RECENT ROUNDS" />
    <div style={{ marginTop: 10 }}>
      {lastRound && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: BG_1,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            marginBottom: 8,
          }}
        >
          <Activity size={14} color={T60 as unknown as string} strokeWidth={2} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: T100,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lastRound.courseName}
            </div>
            <div style={{ fontSize: 11, color: T60, marginTop: 2 }}>
              {lastRound.relativeTime}
            </div>
          </div>
        </div>
      )}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: T40,
          fontStyle: 'italic',
        }}
      >
        Round history coming soon
      </p>
    </div>
  </div>
);
