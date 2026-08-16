/**
 * BRIEF_MESSAGES_ECHO_PALETTE §4 — THE SHARED-GROUND STRIP.
 *
 * The one thing no other messenger can show: the golf the two of you have
 * played together. Glass cards, course and both scores and when, YOUR SCORE IN
 * AMBER because amber is the viewing member (§6).
 *
 * §4.1 NO SHARED ROUNDS -> NO STRIP. This component returns null; it never
 * renders an empty rail or a "no rounds yet" apology.
 *
 * §4.2 The data already exists — see useSharedGround. Tapping a card opens the
 * app's real scorecard (RoundDetailSheet), resolved from the viewer's own
 * whs_scores row for that date and course. detect_shared_rounds does not return
 * a score id, so the mapping is done here against the member's own score list
 * (already cached for the handicap surfaces). A card we cannot map is still
 * shown — it just does not open, rather than opening someone else's round.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useAllScores } from '@/lib/whs/hooks';
import { RoundDetailSheet } from '@/components/profile/handicap/RoundDetailSheet';
import { formatDayMonthShortGB } from '@/i18n/format';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import type { SharedGround } from '@/hooks/messaging/useSharedGround';

interface Props {
  ground: SharedGround;
  rivalFirstName: string;
}

export const SharedGroundStrip: React.FC<Props> = ({ ground, rivalFirstName }) => {
  const { t } = useTranslation('messaging');
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const connectionId = (connection as { id?: string } | null | undefined)?.id;
  const { data: myScores } = useAllScores(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);

  // (play_date + course) -> the viewer's own score id, so a tap opens THEIR card.
  const scoreIdByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of myScores ?? []) {
      if (!s.play_date) continue;
      const byId = `${s.play_date}|${s.course_id ?? ''}`;
      const byName = `${s.play_date}|${(s.course?.name ?? '').toLowerCase()}`;
      if (!map[byId]) map[byId] = s.id;
      if (!map[byName]) map[byName] = s.id;
    }
    return map;
  }, [myScores]);

  if (ground.count === 0 || ground.rounds.length === 0) return null;

  const resolveScoreId = (playDate: string, courseId: string, courseName: string) =>
    scoreIdByKey[`${playDate}|${courseId ?? ''}`] ??
    scoreIdByKey[`${playDate}|${(courseName ?? '').toLowerCase()}`] ??
    null;

  return (
    <>
      <div style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ ...MT.EYEBROW, padding: '0 14px 8px' }}>
          {t('shared.eyebrow', {
            name: rivalFirstName,
            count: ground.count,
            defaultValue: `Played with ${rivalFirstName} · ${ground.count}`,
          })}
        </div>

        <div className="msg-rail" style={{ padding: '0 14px' }}>
          {ground.rounds.slice(0, 12).map((r) => {
            const scoreId = resolveScoreId(r.play_date, r.course_id, r.course_name);
            const tappable = !!scoreId;
            return (
              <div
                key={`${r.play_date}-${r.course_id}`}
                role={tappable ? 'button' : undefined}
                tabIndex={tappable ? 0 : undefined}
                onClick={() => scoreId && setOpenScoreId(scoreId)}
                onKeyDown={(e) => {
                  if (!scoreId) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpenScoreId(scoreId);
                  }
                }}
                className="ec-glass"
                style={{
                  flex: '0 0 auto',
                  width: 168,
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: tappable ? 'pointer' : 'default',
                }}
              >
                <span
                  className="truncate"
                  style={{ ...MT.NAME, color: MSG.INK, fontSize: 13, minWidth: 0 }}
                >
                  {r.course_name}
                </span>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* §6 AMBER IS THE VIEWING MEMBER. */}
                    <span style={{ ...MT.SCORE, color: MSG.AMBER }}>{r.user_gross}</span>
                    <span style={MT.MICRO}>{t('shared.you', { defaultValue: 'You' })}</span>
                  </div>
                  <span style={{ ...MT.SCORE, color: MSG.INK_3, fontSize: 13, paddingBottom: 3 }}>
                    ·
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ ...MT.SCORE, color: MSG.INK }}>{r.rival_gross}</span>
                    <span className="truncate" style={{ ...MT.MICRO, maxWidth: 62 }}>
                      {rivalFirstName}
                    </span>
                  </div>
                </div>

                <span style={MT.CONTEXT}>{formatDayMonthShortGB(r.play_date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <RoundDetailSheet
        open={!!openScoreId}
        scoreId={openScoreId}
        onClose={() => setOpenScoreId(null)}
      />
    </>
  );
};

export default SharedGroundStrip;
