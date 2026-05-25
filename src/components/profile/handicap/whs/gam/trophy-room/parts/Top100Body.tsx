import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAM } from '../../tokens';
import { useTop100ListProgress, type Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import { top100BadgeIdToListSlug } from '../_shared/showpieces';
import { Top100CourseRow } from './Top100CourseRow';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'achievement' }>;
  ownerUserId: string;
  viewerUserId: string;
  onClose: () => void;
}

type Tab = 'played' | 'unplayed';

export const Top100Body: React.FC<Props> = ({ item, ownerUserId, viewerUserId, onClose }) => {
  const navigate = useNavigate();
  const slug = top100BadgeIdToListSlug(item.badgeId);
  const isFriendView = ownerUserId !== viewerUserId;

  const { data: rows = [], isLoading } = useTop100ListProgress(
    slug ?? undefined,
    ownerUserId,
    viewerUserId,
  );

  const { played, unplayed, ownerPlayedCount, viewerPlayedCount } = useMemo(() => {
    const p: Top100CourseProgress[] = [];
    const u: Top100CourseProgress[] = [];
    let owner = 0;
    let viewer = 0;
    for (const row of rows) {
      if (row.is_owner_played) {
        p.push(row);
        owner++;
      } else {
        u.push(row);
      }
      if (row.is_viewer_played) viewer++;
    }
    return { played: p, unplayed: u, ownerPlayedCount: owner, viewerPlayedCount: viewer };
  }, [rows]);

  const [tab, setTab] = useState<Tab>(isFriendView ? 'unplayed' : 'played');

  const total = rows.length;
  const handleNavigate = (courseId: string) => {
    onClose();
    setTimeout(() => navigate(`/courses/${courseId}`), 100);
  };

  if (!slug) {
    return (
      <div style={{ padding: '20px 20px', color: 'var(--hcp-t-60)', fontFamily: GAM.FONT_GEIST }}>
        Unknown Top 100 list.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '4px 0 24px',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
      }}
    >
      <div style={{ padding: '14px 20px 12px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-100)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: GAM.AMBER }} aria-hidden>•</span>
          {item.name}
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 200,
            letterSpacing: '-0.045em',
            color: 'var(--hcp-t-100)',
            marginTop: 6,
            lineHeight: 0.95,
            ...GAM.TABULAR,
          }}
        >
          {ownerPlayedCount}
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--hcp-t-60)',
              letterSpacing: '0.02em',
              marginLeft: 6,
            }}
          >
            of {total} played
          </span>
        </div>
        {isFriendView && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--hcp-t-60)',
              marginTop: 8,
              ...GAM.TABULAR,
            }}
          >
            <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>You</span> have played{' '}
            <span style={{ color: GAM.AMBER, fontWeight: 700 }}>{viewerPlayedCount}</span> of these
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--hcp-line)',
          marginBottom: 8,
        }}
      >
        {(['played', 'unplayed'] as Tab[]).map((key) => {
          const active = tab === key;
          const count = key === 'played' ? played.length : unplayed.length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '8px 6px',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${GAM.AMBER}` : '2px solid transparent',
                color: active ? 'var(--hcp-t-100)' : 'var(--hcp-t-60)',
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                fontFamily: GAM.FONT_GEIST,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {key === 'played' ? 'Played' : 'Unplayed'}
              <span style={{ ...GAM.TABULAR, fontWeight: 600, color: 'var(--hcp-t-60)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 8px' }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--hcp-t-60)' }}>
            Loading courses…
          </div>
        ) : tab === 'played' ? (
          played.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {played.map((row) => (
                <Top100CourseRow
                  key={row.course_id}
                  row={row}
                  isFriendView={isFriendView}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={isFriendView ? "They haven't played any of these yet." : "You haven't played any of these yet."} />
          )
        ) : unplayed.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {unplayed.map((row) => (
              <Top100CourseRow
                key={row.course_id}
                row={row}
                isFriendView={isFriendView}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Every course played. The list is complete." />
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--hcp-t-60)' }}>
    {message}
  </div>
);

export default Top100Body;
