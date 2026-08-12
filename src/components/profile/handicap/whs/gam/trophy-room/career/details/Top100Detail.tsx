/**
 * Top 100 list detail: the count against the fixed set, the standing (subject
 * to the floor and the crossover), the courses played, and the highest-ranked
 * courses not played.
 *
 * MatchRequestSheet is retained deliberately: it is the only route a member
 * has to claim a Top 100 course whose WHS name does not match the list entry.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REC } from '../tokens';
import { Panel, BackLink, Kicker, Caption, Figure, Bar, MetaLabel } from '../Primitives';
import { top100Standing, nextDistribution } from '../shareModel';
import { plural } from '../format';
import { top100BadgeIdToListSlug } from '../../_shared/showpieces';
import { useTop100ListProgress, type Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import { Top100CourseRow } from '../../parts/Top100CourseRow';
import { MatchRequestSheet } from '../../parts/MatchRequestSheet';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  item: Achievement;
  onBack: () => void;
}

export const Top100Detail: React.FC<Props> = ({ data, item, onBack }) => {
  const navigate = useNavigate();
  const slug = top100BadgeIdToListSlug(item.badgeId);
  const { isFriendView, ownerUserId, viewerUserId } = data;
  const { data: rows = [], isLoading } = useTop100ListProgress(
    slug ?? undefined,
    ownerUserId,
    viewerUserId,
  );
  const [matchRequest, setMatchRequest] = useState<{ courseId: string; courseName: string } | null>(
    null,
  );

  const { played, unplayed, viewerPlayed } = useMemo(() => {
    const p: Top100CourseProgress[] = [];
    const u: Top100CourseProgress[] = [];
    let viewer = 0;
    for (const row of rows) {
      if (row.is_owner_played) p.push(row);
      else u.push(row);
      if (row.is_viewer_played) viewer++;
    }
    return { played: p, unplayed: u, viewerPlayed: viewer };
  }, [rows]);

  const count = item.currentValue ?? played.length;
  const standing = top100Standing(
    data.distribution,
    slug ?? '',
    count,
    data.config.top100ShareFloor,
    data.config.top100RankCrossover,
    data.config.shareMinDenominator,
  );
  const next = slug ? nextDistribution(data.distribution, slug, count) : null;
  const highestUnplayed = unplayed.slice(0, 5);

  const handleNavigate = (courseId: string) => navigate(`/courses/${courseId}`);

  return (
    <div style={{ fontFamily: REC.FONT }}>
      <BackLink label="Back to the record" onClick={onBack} />
      <Kicker>TOP 100</Kicker>
      <h3
        style={{
          margin: '8px 0 0',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: REC.INK,
        }}
      >
        {item.name}
      </h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 8px' }}>
        <Figure value={count} size={40} color={count > 0 ? REC.AMBER : REC.DIM} />
        <span style={{ fontSize: 13, color: REC.MUTE, ...REC.TABULAR }}>of 100 played</span>
      </div>
      <Bar pct={count} />
      <div style={{ marginTop: 8 }}>
        {standing.kind === 'share' && (
          <Caption>
            <span style={{ color: REC.GOOD, fontWeight: 700 }}>
              Ahead of {standing.pct}% of members with a posted index
            </span>
          </Caption>
        )}
        {standing.kind === 'ordinal' && (
          <Caption>
            <span style={{ color: REC.GOOD, fontWeight: 700 }}>
              Among the top {standing.members} of any member
            </span>
          </Caption>
        )}
        {standing.kind === 'none' && (
          <Caption>
            {count === 0
              ? 'No courses on this list played yet.'
              : `${100 - count} ${plural(100 - count, 'course', 'courses')} still to play.`}
          </Caption>
        )}
      </div>
      {next && (
        <div style={{ marginTop: 4 }}>
          <Caption>
            <span style={REC.TABULAR}>
              {next.threshold - count} more reaches {next.threshold}
            </span>
          </Caption>
        </div>
      )}
      {isFriendView && (
        <div style={{ marginTop: 6 }}>
          <Caption>
            <span style={REC.TABULAR}>You have played {viewerPlayed} of these</span>
          </Caption>
        </div>
      )}

      <div style={{ height: 12 }} />

      {isLoading ? (
        <Caption>Loading the list.</Caption>
      ) : (
        <>
          <Panel
            title={`PLAYED (${played.length})`}
          >
            {played.length === 0 ? (
              <div style={{ padding: '14px' }}>
                <Caption>
                  {isFriendView
                    ? 'None of this list played yet.'
                    : 'None of this list played yet. Rate a course to put it on the record.'}
                </Caption>
              </div>
            ) : (
              played.map((row) => (
                <Top100CourseRow
                  key={row.course_id}
                  row={row}
                  isFriendView={isFriendView}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </Panel>

          {highestUnplayed.length > 0 && (
            <Panel title="HIGHEST NOT PLAYED">
              {highestUnplayed.map((row) => (
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
              <div style={{ padding: '10px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
                <MetaLabel>PLAYED ONE ALREADY? MATCH IT TO YOUR ROUND</MetaLabel>
              </div>
            </Panel>
          )}
        </>
      )}

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

export default Top100Detail;
