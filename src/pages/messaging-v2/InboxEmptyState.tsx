/**
 * ADDENDUM TO BRIEF_MESSAGES_DARK — THE EMPTY STATE.
 *
 * §2 THE RULE, EXTENDED: the image is information or it is absent — SO IS THE
 * EMPTY STATE. An empty inbox is not empty of data; it only lacks THREADS. So
 * the empty state IS THE COMPOSE LIST, INLINE: real golfers, where and when
 * you last played them, one tap from not being empty.
 *
 * §3 NO ILLUSTRATION AND NO GLYPH. Two lines of type, then people.
 * §3.1 THE FOOTER ACTION IS WHITE ON DARK — the brightest thing on the screen,
 *      because it is the only other thing to do. Never a dark pill.
 * §3.2 THE CONTENT FILLS THE SCREEN: the list runs, the action pins to the
 *      foot, and there is no block of dead black under it.
 * §3.3 CAP THE LIST at what fits without scrolling past the footer — five.
 * §5  THE BARE STATE is deliberately sparse and NOT dressed up to match.
 * §6  NO AMBER on either screen. These are other people, not the member's own
 *     data, so amber has no job here. Three solid ink tiers, ink and white.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';
import { useSharedGroundBatch } from '@/hooks/messaging/useSharedGround';
import { useInboxStarters } from '@/hooks/messaging/useInboxStarters';
import { MSG, MT } from '@/features/messaging-dark/tokens';

const CAP = 5;

/** "Wentworth · 2 Aug" — course and when, or nothing at all (§4). */
function formatWhen(dateISO: string | null): string | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

const StarterSkeleton: React.FC = () => (
  <div style={{ padding: '0 16px' }}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 0',
          borderBottom: `0.5px solid ${MSG.RULE}`,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: '34%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ height: 10, width: '40%', borderRadius: 3, background: 'rgba(255,255,255,0.09)' }} />
          <div style={{ height: 9, width: '62%', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    ))}
  </div>
);

interface Props {
  /** Opens the compose sheet — the footer action and the bare state's action. */
  onCompose: () => void;
}

const InboxEmptyState: React.FC<Props> = ({ onCompose }) => {
  const { t } = useTranslation('messaging');
  const { user } = useSupabaseSession();
  const { start, isStarting } = useStartConversation();
  const { kind, members } = useInboxStarters(user?.id, !!user?.id, CAP);

  // Course and date for the played-with rows only. Reuses the thread strip's
  // cache keys, so nothing here is a new shape of query.
  const playedIds = useMemo(
    () => (kind === 'played' ? members.map((m) => m.userId) : []),
    [kind, members],
  );
  const { byUserId } = useSharedGroundBatch(user?.id, playedIds, CAP);

  const isLoading = kind === 'loading';
  const isPopulated = kind === 'played' || kind === 'circle';

  // §5 A failed read is a loading problem, not an empty one: 'unresolved'
  // shows the bare copy but never the "you have nobody" claim being true.
  const bareBody =
    kind === 'unresolved'
      ? t('empty.bareUnresolvedBody', {
          defaultValue: 'Search for a golfer, club or business to start a conversation.',
        })
      : t('empty.bareBody', {
          defaultValue: 'Follow a few golfers and your conversations will start here.',
        });

  const footer = (
    <div
      style={{
        flexShrink: 0,
        padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
        borderTop: isPopulated ? `0.5px solid ${MSG.RULE}` : 'none',
        background: MSG.BLACK,
      }}
    >
      <button
        type="button"
        onClick={onCompose}
        className="active:opacity-80"
        style={{
          width: '100%',
          border: 'none',
          borderRadius: 14,
          background: '#FFFFFF',
          color: MSG.BLACK,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.011em',
          padding: '15px 18px',
        }}
      >
        {isPopulated
          ? t('empty.messageSomeoneElse', { defaultValue: 'Message someone else' })
          : t('empty.messageSomeone', { defaultValue: 'Message someone' })}
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col" style={{ background: MSG.BLACK }}>
        <div style={{ padding: '10px 16px 16px' }}>
          <div style={{ height: 14, width: 140, borderRadius: 3, background: 'rgba(255,255,255,0.09)' }} />
        </div>
        <StarterSkeleton />
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  // ── §5 THE BARE STATE. Deliberately sparse. ──────────────────────────────
  if (!isPopulated) {
    return (
      <div className="flex h-full flex-col" style={{ background: MSG.BLACK }}>
        <div
          className="flex flex-1 flex-col justify-center"
          style={{ padding: '0 22px', gap: 10 }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.024em',
              color: MSG.INK,
            }}
          >
            {t('empty.bareTitle', { defaultValue: 'No conversations yet' })}
          </h2>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45, color: MSG.INK_3, maxWidth: 280 }}>
            {bareBody}
          </p>
        </div>
        {footer}
      </div>
    );
  }

  // ── §3 THE POPULATED STATE. ───────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col" style={{ background: MSG.BLACK }}>
      <div className="flex-1" style={{ minHeight: 0, overflowY: 'auto' }}>
        <div style={{ padding: '8px 16px 16px' }}>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.018em',
              color: MSG.INK,
            }}
          >
            {t('empty.startTitle', { defaultValue: 'Nothing here yet' })}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.4, color: MSG.INK_3 }}>
            {/* §4 / E — the copy changes with the set, on the heading AND the rows. */}
            {kind === 'played'
              ? t('empty.startPlayed', { defaultValue: "Start with someone you've played with." })
              : t('empty.startCircle', { defaultValue: 'Start with someone in your circle.' })}
          </p>
        </div>

        <div>
          {members.map((m) => {
            const ground = kind === 'played' ? byUserId[m.userId] : undefined;
            const when = formatWhen(ground?.lastPlayDate ?? null);
            const course = ground?.lastCourseName ?? null;
            // §F A row with no context to show carries NO context line.
            const context =
              kind === 'circle'
                ? t('empty.inCircle', { defaultValue: 'In your circle' })
                : course
                  ? [course, when].filter(Boolean).join(' · ')
                  : ground && ground.count > 0
                    ? t('context.roundsTogether', {
                        count: ground.count,
                        defaultValue: `${ground.count} rounds together`,
                      })
                    : null;

            return (
              <div
                key={m.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderTop: `0.5px solid ${MSG.RULE}`,
                }}
              >
                <SquircleAvatar
                  src={m.avatarUrl ?? undefined}
                  userId={m.userId}
                  alt={m.name}
                  size={44}
                  hairlineRing
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...MT.NAME,
                      color: MSG.INK,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.name}
                  </div>
                  {context ? (
                    <div
                      style={{
                        ...MT.CONTEXT,
                        marginTop: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {context}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isStarting}
                  onClick={() => start({ actorType: 'personal', actorId: m.userId })}
                  className="active:opacity-60"
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: `0.5px solid rgba(255,255,255,0.16)`,
                    borderRadius: 999,
                    padding: '7px 14px',
                    color: MSG.INK,
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: '-0.006em',
                  }}
                >
                  {t('action.message', { defaultValue: 'Message' })}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {footer}
    </div>
  );
};

export default InboxEmptyState;
