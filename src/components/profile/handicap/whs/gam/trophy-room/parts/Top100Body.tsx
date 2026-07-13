import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAM } from '../../tokens';
import { useTop100ListProgress, type Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import { top100BadgeIdToListSlug } from '../_shared/showpieces';
import { Top100CourseRow } from './Top100CourseRow';
import { AchievementBody } from './AchievementBody';
import { MatchRequestSheet } from './MatchRequestSheet';
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

  const { played, unplayed, viewerPlayedCount } = useMemo(() => {
    const p: Top100CourseProgress[] = [];
    const u: Top100CourseProgress[] = [];
    let viewer = 0;
    for (const row of rows) {
      if (row.is_owner_played) p.push(row);
      else u.push(row);
      if (row.is_viewer_played) viewer++;
    }
    return { played: p, unplayed: u, viewerPlayedCount: viewer };
  }, [rows]);

  const [tab, setTab] = useState<Tab>(isFriendView ? 'unplayed' : 'played');
  const [matchRequest, setMatchRequest] = useState<{ courseId: string; courseName: string } | null>(null);

  const handleNavigate = (courseId: string) => {
    onClose();
    setTimeout(() => navigate(`/courses/${courseId}`), 100);
  };

  if (!slug) {
    return (
      <div style={{ padding: '16px', color: 'rgba(255,255,255,0.55)', fontFamily: GAM.FONT_GEIST }}>
        Unknown Top 100 list.
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
      }}
    >
      {/* Full Forge anatomy: title + description, NEXT journey strip,
          THE FORGE ladder + TierKey, FriendsBlock. Hero lives in DetailHero above. */}
      <AchievementBody item={item} viewerUserId={viewerUserId} />

      {/* Friend cross-reference (kept from prior design). */}
      {isFriendView && (
        <div
          style={{
            padding: '0 16px 12px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
            ...GAM.TABULAR,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.96)', fontWeight: 700 }}>You</span> have played{' '}
          <span style={{ color: GAM.AMBER, fontWeight: 700 }}>{viewerPlayedCount}</span> of these
        </div>
      )}

      {/* THE COURSES — Top-100's unique value: played/unplayed tabs + list. */}
      <div style={{ padding: '4px 16px 6px' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          THE COURSES
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '12px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                color: active ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.55)',
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
              <span style={{ ...GAM.TABULAR, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 8px 24px' }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
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
                onRequestMatch={
                  isFriendView
                    ? undefined
                    : (id, name) => setMatchRequest({ courseId: id, courseName: name })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Every course played. The list is complete." />
        )}
      </div>

      {matchRequest && (
        <MatchRequestSheet
          courseId={matchRequest.courseId}
          courseName={matchRequest.courseName}
          onClose={() => setMatchRequest(null)}
        />
      )}
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
    {message}
  </div>
);

export default Top100Body;

