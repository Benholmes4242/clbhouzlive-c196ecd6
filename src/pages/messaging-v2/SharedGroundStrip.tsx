/**
 * BRIEF_MESSAGES_ECHO_PALETTE §4 — THE SHARED-GROUND STRIP.
 * MS1 §4 — RESTYLED TO THE SIGNED-OFF MOCK (ms1-head-to-head.html).
 *
 * The one thing no other messenger can show: the golf the two of you have
 * played together. Cards are 150px on #17171B, the course is the SHORT name
 * (shortCourseName), both gross scores are 18px with the LOWER score in ink
 * and the higher dimmed (a tie leaves both ink), and the line under reads
 * "{d MMM} · you won" / "{name} won" / "halved" from gross_outcome.
 * MS1 §9 — NO AMBER: the member's own score is no longer amber; ink/dim
 * carries the result.
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
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { formatDayMonthShortGB } from '@/i18n/format';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { MSG } from '@/features/messaging-dark/tokens';
import type { SharedGround } from '@/hooks/messaging/useSharedGround';

const CARD_BG = '#17171B';
const CARD_EDGE = 'rgba(255,255,255,0.08)';
const DIM = 'rgba(248,250,252,0.42)';

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
      <div className="msg-rail" style={{ padding: '10px 16px 12px', gap: 8 }}>
        {ground.rounds.slice(0, 12).map((r) => {
          const scoreId = resolveScoreId(r.play_date, r.course_id, r.course_name);
          const tappable = !!scoreId;
          const tied = r.gross_outcome === 'T';
          const youWon = r.gross_outcome === 'W';
          const outcome =
            r.gross_outcome === 'W'
              ? t('shared.youWon', { defaultValue: 'you won' })
              : r.gross_outcome === 'L'
                ? t('shared.rivalWon', {
                    name: rivalFirstName,
                    defaultValue: `${rivalFirstName} won`,
                  })
                : t('shared.halved', { defaultValue: 'halved' });
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
              data-testid="shared-round-card"
              style={{
                flex: '0 0 auto',
                width: 150,
                background: CARD_BG,
                border: `1px solid ${CARD_EDGE}`,
                borderRadius: 14,
                padding: '10px 12px',
                cursor: tappable ? 'pointer' : 'default',
              }}
            >
              <span
                className="truncate"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: MSG.INK,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shortCourseName(r.course_name)}
              </span>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 6,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: tied || youWon ? MSG.INK : DIM }}>
                  {r.user_gross}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: DIM,
                      marginTop: 1,
                    }}
                  >
                    {t('shared.you', { defaultValue: 'You' })}
                  </span>
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 18, fontWeight: 700, color: tied || !youWon ? MSG.INK : DIM }}
                >
                  {r.rival_gross}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: DIM,
                      marginTop: 1,
                      maxWidth: 72,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {rivalFirstName}
                  </span>
                </div>
              </div>

              <span
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: DIM,
                  marginTop: 6,
                }}
              >
                {formatDayMonthShortGB(r.play_date)} · {outcome}
              </span>
            </div>
          );
        })}
      </div>

      <RoundDetailSheet
        open={!!openScoreId}
        scoreId={openScoreId}
        connectionId={connectionId ?? null}
        profileUserId={user?.id ?? null}
        onClose={() => setOpenScoreId(null)}
      />
    </>
  );
};

export default SharedGroundStrip;
