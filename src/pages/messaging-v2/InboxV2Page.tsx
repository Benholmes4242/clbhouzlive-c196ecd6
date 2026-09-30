/**
 * BRIEF_MESSAGES_DARK §2 / §4 — the inbox on the Clubhouse canvas (#05070A).
 *
 * THE LIST CARRIES NO PHOTOGRAPH (§2.1, withdrawn from the previous brief). On
 * Echo a photograph had a referent — the course being asked about. Here it had
 * none: not the member's course, not the thread's course, just a picture behind
 * a utility list. THE IMAGE IS INFORMATION OR IT IS ABSENT, NEVER ATMOSPHERE.
 *
 * BRIEF_MESSAGES_INBOX_LANDING: search, the played-with rail and the filter
 * chips render whenever there is at least one thread — a binary, not a
 * threshold. The empty inbox is unchanged. Threads with nothing said in them
 * are not rendered at all (§4.1).
 */


import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, PencilLine, Plus, Search, X } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { ConversationRow } from './ConversationRow';
import NewConversationSheet from './NewConversationSheet';
import InboxEmptyState from './InboxEmptyState';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSharedGroundBatch } from '@/hooks/messaging/useSharedGround';
import { useInboxStarters } from '@/hooks/messaging/useInboxStarters';
import { useStartConversation } from '@/hooks/messaging/useStartConversation';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { RailChips } from '@/components/ui/RailChips';
import { MemberRailTile } from './MemberRailTile';
import { formatRelative } from '@/i18n/format';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import { isSpeakableThread } from './messagePreview';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import '@/features/messaging-dark/messages-dark.css';

type InboxFilter = 'all' | 'unread' | 'played';
const RAIL_CAP = 8;

const SkeletonRow: React.FC = () => (
  <div className="msg-row msg-row-sep" style={{ pointerEvents: 'none' }}>
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: '34%',
        background: 'rgba(255,255,255,0.07)',
      }}
    />
    <div className="flex-1 flex flex-col" style={{ gap: 7 }}>
      <div style={{ height: 10, width: '38%', borderRadius: 3, background: 'rgba(255,255,255,0.09)' }} />
      <div style={{ height: 9, width: '66%', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  </div>
);

const InboxV2Page: React.FC = () => {
  const { t } = useTranslation(['messaging', 'common']);
  const navigate = useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const { conversations, isLoading, error, refetch, hasActor } = useConversations();
  const actor = useMessagingActor();
  const { user } = useSupabaseSession();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { start } = useStartConversation();
  const { kind: starterKind, members: starters } = useInboxStarters(user?.id, !!user?.id, RAIL_CAP);
  const railIds = useMemo(
    () => (starterKind === 'played' ? starters.map((m) => m.userId) : []),
    [starterKind, starters],
  );
  const { byUserId: railGround } = useSharedGroundBatch(user?.id, railIds, RAIL_CAP);

  useEffect(() => {
    if (!actor) return;
    const key = `clbhouz_bizmsg_earlyaccess_dismissed_${actor.actorId}`;
    if (safeLocalStorage.get(key) === 'true') setBannerDismissed(true);
  }, [actor]);

  // §2.1 A thread with no messages has no preview because nothing was ever
  // said in it. It is not a blank row to fill — it is a row to leave out.
  const speakable = useMemo(
    () => conversations.filter(isSpeakableThread),
    [conversations],
  );

  const hasList = hasActor && !isLoading && !error && speakable.length > 0;
  const isEmptyInbox = hasActor && !isLoading && !error && speakable.length === 0 && !query.trim();

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return speakable;
    return speakable.filter((c) => {
      const names = c.participants.map((p) => (p.name ?? p.username ?? '').toLowerCase());
      return (
        (c.title ?? '').toLowerCase().includes(q) ||
        names.some((n) => n.includes(q)) ||
        (c.last_message_preview ?? '').toLowerCase().includes(q)
      );
    });
  }, [speakable, query]);

  const otherPersonalId = (c: (typeof speakable)[number]) => {
    if (c.type !== 'direct') return null;
    const other = c.participants.find(
      (p) => !(p.actor_type === actor?.actorType && p.actor_id === actor?.actorId),
    );
    return other?.actor_type === 'personal' ? other.actor_id : null;
  };

  // §2.3 the context line. ONE batched count query for the whole list; round
  // detail only for direct threads that actually have shared golf.
  const directUserIds = useMemo(
    () =>
      searched
        .map(otherPersonalId)
        .filter((id): id is string => !!id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searched, actor],
  );
  const { byUserId } = useSharedGroundBatch(user?.id, directUserIds);

  const groundOf = (c: (typeof speakable)[number]) => {
    const id = otherPersonalId(c);
    return id ? byUserId[id] : undefined;
  };

  // Chips filter the in-memory list only; they compose with the search query.
  const visible = searched.filter((c) => {
    if (filter === 'unread') return c.unread_count > 0;
    if (filter === 'played') {
      const g = groundOf(c);
      return !!g && g.count > 0;
    }
    return true;
  });
  const isFiltering = !!query.trim() || filter !== 'all';

  return (
    <div className="messages-root" style={{ background: MSG.BLACK, color: MSG.INK }}>
      <div className="flex h-full w-full flex-col" style={{ background: MSG.BLACK }}>
        {/* ── Header: no photograph, no scrim (§2.1). Flat canvas. ──────── */}
        <header
          className="z-30 flex-shrink-0"
          style={{ position: 'relative', background: MSG.BLACK }}
        >

          <div
            style={{
              position: 'relative',
              paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
              paddingBottom: 14,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <div className="flex items-center justify-between" style={{ minHeight: 36 }}>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label={t('messaging:a11y.back')}
                  className="active:opacity-60"
                  style={{
                    width: 32,
                    height: 32,
                    marginLeft: -6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: MSG.INK,
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <h1 style={{ ...MT.TITLE, margin: 0 }}>{t('messaging:title.inbox')}</h1>
              </div>

              <div className="flex items-center" style={{ gap: 2 }}>
                <button
                  type="button"
                  aria-label={t('messaging:a11y.newMessage')}
                  onClick={() => setComposeOpen(true)}
                  className="active:opacity-60"
                  style={{
                    width: 34,
                    height: 34,
                    marginRight: -4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: MSG.INK,
                  }}
                >
                  <PencilLine size={19} />
                </button>
              </div>
            </div>

          </div>

          {hasList ? (
            <>
              <div
                style={{
                  margin: '0 14px 11px',
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${MSG.EDGE}`,
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Search size={15} color={MSG.INK_3} />
                <input
                  className="msg-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('messaging:search.threads', {
                    defaultValue: 'Search conversations',
                  })}
                  aria-label={t('messaging:search.threads', {
                    defaultValue: 'Search conversations',
                  })}
                  style={{ fontSize: 14, fontWeight: 500 }}
                />
              </div>

              {starterKind === 'played' ? (
                <div
                  className="no-scrollbar"
                  style={{
                    display: 'flex',
                    gap: 13,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    padding: '2px 14px 14px',
                    alignItems: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setComposeOpen(true)}
                    aria-label={t('messaging:a11y.newMessage')}
                    className="active:opacity-60"
                    style={{ width: 62, flex: 'none', background: 'transparent', border: 'none', padding: 0, textAlign: 'center' }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        margin: '0 auto',
                        borderRadius: 17,
                        border: '1px dashed rgba(255,255,255,0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: MSG.INK_2,
                      }}
                    >
                      <Plus size={20} />
                    </div>
                    <div style={{ marginTop: 5, fontSize: 11, color: MSG.INK_2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t('messaging:rail.start', { defaultValue: 'Start' })}
                    </div>
                  </button>
                  {starters.map((m) => {
                    const date = railGround[m.userId]?.lastPlayDate ?? m.lastPlayDate;
                    return (
                      <MemberRailTile
                        key={m.userId}
                        onClick={() => start({ actorType: 'personal', actorId: m.userId })}
                        avatarUrl={m.avatarUrl}
                        userId={m.userId}
                        name={m.name}
                        label={m.name.split(' ')[0]}
                        bubble={date ? (
                          <span
                            style={{
                              display: 'inline-block',
                              background: 'rgba(255,255,255,0.09)',
                              borderRadius: 10,
                              padding: '4px 7px',
                              fontSize: 9.5,
                              lineHeight: 1.25,
                              color: MSG.INK_2,
                              marginBottom: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatRelative(date)}
                          </span>
                        ) : null}
                      />
                    );
                  })}
                </div>
              ) : null}

              <div style={{ padding: '0 14px 11px' }}>
                <RailChips
                  ariaLabel={t('messaging:title.inbox')}
                  value={filter}
                  onChange={(v) => setFilter(v as InboxFilter)}
                  options={[
                    { id: 'all', label: t('messaging:filter.all', { defaultValue: 'All' }) },
                    { id: 'unread', label: t('messaging:filter.unread', { defaultValue: 'Unread' }) },
                    { id: 'played', label: t('messaging:filter.playedWith', { defaultValue: 'Played with' }) },
                  ]}
                />
              </div>
            </>
          ) : null}
        </header>

        {/* ── The list ───────────────────────────────────────────────────── */}
        {/* §3.2 when the inbox is empty the region does not scroll and carries
            no bottom padding: the empty state owns the full height so its
            action can pin to the foot with no dead black beneath it. */}
        <div
          className={isEmptyInbox ? 'flex-1' : 'flex-1 overflow-y-auto'}
          style={{
            WebkitOverflowScrolling: 'touch',
            background: MSG.BLACK,
            minHeight: 0,
            paddingBottom: isEmptyInbox
              ? 0
              : 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
          }}
        >
          {!hasActor || isLoading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </>
          ) : error ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: '80px 24px', gap: 14 }}
            >
              <p style={{ color: MSG.INK, fontSize: 16, fontWeight: 600, margin: 0 }}>
                {t('messaging:error.couldntLoadInbox')}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="ec-glass--pill"
                style={{
                  color: MSG.INK,
                  fontSize: 13.5,
                  fontWeight: 600,
                  padding: '9px 20px',
                  borderRadius: 999,
                }}
              >
                {t('common:action.tryAgain')}
              </button>
            </div>
          ) : visible.length === 0 && isFiltering ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ padding: '72px 32px' }}
            >
              <p style={{ color: MSG.INK_2, fontSize: 14.5, fontWeight: 600, margin: 0 }}>
                {t('messaging:search.noResults')}
              </p>
            </div>
          ) : visible.length === 0 ? (
            /* ADDENDUM — THE EMPTY STATE IS THE COMPOSE LIST, INLINE. */
            <InboxEmptyState onCompose={() => setComposeOpen(true)} />
          ) : (
            <div>
              {actor?.actorType === 'business' && !bannerDismissed && (
                <div style={{ padding: '12px 14px 4px' }}>
                  <div
                    className="ec-glass"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...MT.EYEBROW, margin: 0 }}>
                        {t('messaging:banner.businessTitle')}
                      </p>
                      <p style={{ margin: '5px 0 0', fontSize: 13, color: MSG.INK_2, lineHeight: 1.45 }}>
                        {t('messaging:banner.businessBody')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setComposeOpen(true)}
                        style={{
                          marginTop: 8,
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: MSG.INK,
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        {t('messaging:action.newMessage')}
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={t('messaging:action.dismiss')}
                      onClick={() => {
                        if (actor) {
                          safeLocalStorage.set(
                            `clbhouz_bizmsg_earlyaccess_dismissed_${actor.actorId}`,
                            'true',
                          );
                        }
                        setBannerDismissed(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        color: MSG.INK_3,
                        display: 'inline-flex',
                        flexShrink: 0,
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {visible.map((c) => (
                <ConversationRow
                  key={c.conversation_id}
                  conversation={c}
                  ground={groundOf(c)}
                />
              ))}
            </div>
          )}
        </div>

        <NewConversationSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
      </div>
    </div>
  );
};

export default InboxV2Page;
