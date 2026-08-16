import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreVertical, BadgeCheck, MessageCircle } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useThread } from '@/hooks/messaging/useThread';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useConversationDetail } from '@/hooks/messaging/useConversationDetail';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { useSendMessage } from '@/hooks/messaging/useSendMessage';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { ConversationSettingsSheet } from './ConversationSettingsSheet';
import { FIGS } from '@/lib/tokens/type';
import type {
  ConversationDetail,
  ConversationMember,
  InboxConversation,
  InboxParticipant,
  ThreadMessage,
} from '@/types/messaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSharedGroundOne } from '@/hooks/messaging/useSharedGround';
import { useMessagesStagePhoto } from '@/hooks/messaging/useMessagesStagePhoto';
import { SharedGroundStrip } from './SharedGroundStrip';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import '@/features/messaging-dark/messages-dark.css';



/**
 * BRIEF_MESSAGES_ECHO_PALETTE §1 / §4 — the thread on Echo's palette.
 * Near-black surface, course photograph behind the header, scrim for
 * legibility, glass chrome, and no amber at all on this screen (§6): the
 * member's own bubble is white, the send key is white, the retry pill is ink.
 */
const CANVAS = MSG.BLACK;
const INK = MSG.INK;
const SUB = MSG.INK_2;
const HINT = MSG.INK_3;
const HAIRLINE = MSG.RULE;


interface HeaderIdentity {
  name: string;
  avatarUrl: string | null;
  userId: string;
  verified: boolean;
  secondary: string;
}

function resolveHeaderFromDetail(
  detail: ConversationDetail,
  selfActorType: string | null,
  selfActorId: string | null,
): HeaderIdentity {
  if (detail.type === 'group') {
    return {
      name: detail.title ?? 'Group',
      avatarUrl: detail.avatar_url,
      userId: detail.conversation_id,
      verified: false,
      secondary: `${detail.members.length} ${detail.members.length === 1 ? 'member' : 'members'}`,
    };
  }
  const others = detail.members.filter(
    (m) => !(m.actor_type === selfActorType && m.actor_id === selfActorId),
  );
  const m: ConversationMember | undefined = others[0] ?? detail.members[0];
  return {
    name: m?.name ?? m?.username ?? 'Unknown',
    avatarUrl: m?.avatar_url ?? null,
    userId: m?.actor_id ?? detail.conversation_id,
    verified: !!m?.verified,
    secondary: m?.actor_type === 'business' ? 'Business' : '',
  };
}

function resolveHeaderFromInbox(
  conv: InboxConversation,
  selfActorType: string | null,
  selfActorId: string | null,
): HeaderIdentity {
  if (conv.type === 'group') {
    return {
      name: conv.title ?? 'Group',
      avatarUrl: conv.avatar_url,
      userId: conv.conversation_id,
      verified: false,
      secondary: `${conv.participants.length} members`,
    };
  }
  const others = conv.participants.filter(
    (p) => !(p.actor_type === selfActorType && p.actor_id === selfActorId),
  );
  const p: InboxParticipant | undefined = others[0] ?? conv.participants[0];
  return {
    name: p?.name ?? p?.username ?? 'Unknown',
    avatarUrl: p?.avatar_url ?? null,
    userId: p?.actor_id ?? conv.conversation_id,
    verified: !!p?.verified,
    secondary: p?.actor_type === 'business' ? 'Business' : '',
  };
}

function resolveHeaderIdentity(
  detail: ConversationDetail | null,
  conv: InboxConversation | null,
  selfActorType: string | null,
  selfActorId: string | null,
  firstIncoming: ThreadMessage | null,
): HeaderIdentity {
  if (detail) return resolveHeaderFromDetail(detail, selfActorType, selfActorId);
  if (conv) return resolveHeaderFromInbox(conv, selfActorType, selfActorId);
  if (firstIncoming) {
    return {
      name: firstIncoming.sender_name ?? 'Conversation',
      avatarUrl: firstIncoming.sender_avatar_url,
      userId: firstIncoming.sender_actor_id,
      verified: !!firstIncoming.sender_verified,
      secondary: firstIncoming.sender_actor_type === 'business' ? 'Business' : '',
    };
  }
  return { name: 'Conversation', avatarUrl: null, userId: '', verified: false, secondary: '' };
}


interface RunFlags {
  isFirstOfRun: boolean;
  isLastOfRun: boolean;
  isOutgoing: boolean;
}

const RUN_GAP_MS = 5 * 60 * 1000;

function computeRuns(
  messages: ThreadMessage[],
  selfActorType: string | null,
  selfActorId: string | null,
): { flags: RunFlags[]; lastOutgoingIndex: number } {
  const flags: RunFlags[] = [];
  let lastOutgoingIndex = -1;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isOutgoing =
      m.sender_actor_type === selfActorType && m.sender_actor_id === selfActorId;
    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;
    const t = new Date(m.created_at).getTime();
    const sameAsPrev =
      !!prev &&
      prev.sender_actor_type === m.sender_actor_type &&
      prev.sender_actor_id === m.sender_actor_id &&
      Math.abs(t - new Date(prev.created_at).getTime()) < RUN_GAP_MS;
    const sameAsNext =
      !!next &&
      next.sender_actor_type === m.sender_actor_type &&
      next.sender_actor_id === m.sender_actor_id &&
      Math.abs(new Date(next.created_at).getTime() - t) < RUN_GAP_MS;
    flags.push({
      isFirstOfRun: !sameAsPrev,
      isLastOfRun: !sameAsNext,
      isOutgoing,
    });
    if (isOutgoing && m.deleted_at == null) lastOutgoingIndex = i;
  }
  return { flags, lastOutgoingIndex };
}

const SkeletonBubble: React.FC<{ side: 'left' | 'right'; w: number }> = ({ side, w }) => (
  <div
    className="w-full flex"
    style={{ justifyContent: side === 'right' ? 'flex-end' : 'flex-start', marginTop: 10 }}
  >
    <div
      style={{
        width: `${w}%`,
        height: 34,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.07)',
      }}
    />
  </div>
);

const ThreadV2Page: React.FC = () => {
  const { t } = useTranslation(['messaging', 'common']);
  const { conversationId = '' } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // A draft handed over by useStartConversation (e.g. the handicap sync
  // nudge). Read ONCE into a ref, then clear the history entry's state so a
  // back-navigation or a refresh cannot re-seed a message the member has
  // already edited or sent.
  const seededDraftRef = useRef<string | undefined>(
    (location.state as { draft?: string } | null)?.draft,
  );
  useEffect(() => {
    if (!(location.state as { draft?: string } | null)?.draft) return;
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const actor = useMessagingActor();
  const { conversations } = useConversations();
  const conv = useMemo(
    () => conversations.find((c) => c.conversation_id === conversationId) ?? null,
    [conversations, conversationId],
  );
  const { detail } = useConversationDetail(conversationId || null);
  const {
    messages,
    fetchOlder,
    hasOlder,
    isLoading,
    isFetchingOlder,
    error,
    refetch,
  } = useThread(conversationId || null);
  const { retry } = useSendMessage(conversationId);
  const keyboardHeight = useKeyboardHeight();
  const [composerHeight, setComposerHeight] = useState(56);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const handleRetry = useCallback(
    (clientId: string) => {
      void retry(clientId);
    },
    [retry],
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // Pin to bottom on first load / new outgoing/incoming message.
  useEffect(() => {
    if (!messages.length) return;
    const el = scrollerRef.current;
    if (!el) return;
    const lastId = messages[messages.length - 1].id;
    if (!didInitialScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScrollRef.current = true;
      lastMessageIdRef.current = lastId;
      return;
    }
    if (lastId !== lastMessageIdRef.current) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom) el.scrollTop = el.scrollHeight;
      lastMessageIdRef.current = lastId;
    }
  }, [messages]);

  // Load older on scroll near top; preserve scroll offset.
  const prevHeightRef = useRef<number>(0);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 80 && hasOlder && !isFetchingOlder) {
        prevHeightRef.current = el.scrollHeight;
        void fetchOlder();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [fetchOlder, hasOlder, isFetchingOlder]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !prevHeightRef.current) return;
    const delta = el.scrollHeight - prevHeightRef.current;
    if (delta > 0) el.scrollTop = el.scrollTop + delta;
    prevHeightRef.current = 0;
  }, [messages.length]);

  const firstIncoming = useMemo(
    () =>
      messages.find(
        (m) =>
          !(
            m.sender_actor_type === actor?.actorType &&
            m.sender_actor_id === actor?.actorId
          ),
      ) ?? null,
    [messages, actor],
  );

  const header = resolveHeaderIdentity(
    detail,
    conv,
    actor?.actorType ?? null,
    actor?.actorId ?? null,
    firstIncoming,
  );

  const { flags, lastOutgoingIndex } = useMemo(
    () =>
      computeRuns(messages, actor?.actorType ?? null, actor?.actorId ?? null),
    [messages, actor],
  );

  // §4 / §4.2 the shared ground, from the RPC the compare sheet already uses.
  const { user } = useSupabaseSession();
  const isDirect = (detail?.type ?? conv?.type) === 'direct';
  const rivalUserId = useMemo(() => {
    if (!isDirect) return null;
    const members = (detail?.members ?? []) as ConversationMember[];
    const other =
      members.find(
        (m) => !(m.actor_type === actor?.actorType && m.actor_id === actor?.actorId),
      ) ?? null;
    if (other) return other.actor_type === 'personal' ? other.actor_id : null;
    const p = (conv?.participants ?? []).find(
      (x) => !(x.actor_type === actor?.actorType && x.actor_id === actor?.actorId),
    );
    return p?.actor_type === 'personal' ? p.actor_id : null;
  }, [isDirect, detail, conv, actor]);

  const { ground } = useSharedGroundOne(user?.id, rivalUserId);
  const rivalFirstName = (header.name ?? '').trim().split(/\s+/)[0] || header.name;

  // §2.2 THE PHOTOGRAPH IS THE SHARED COURSE OR IT IS ABSENT. The fallback to
  // the member's own most-played course is WITHDRAWN (BRIEF_MESSAGES_DARK §2.3):
  // a thread with no shared golf gets the plain dark header.
  const stage = useMessagesStagePhoto(ground.lastCourseName);
  const [photoIn, setPhotoIn] = useState(false);


  return (
    <div
      className="messages-root flex flex-col"
      style={{
        background: CANVAS,
        color: INK,
        width: '100%',
      }}
    >
      {/* §5 HEADER: the SHARED course photograph where one exists, avatar, name,
          and the golf you have played together. The scrim only exists to carry
          legibility over a photograph, so it renders only with one. */}
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: CANVAS,
          flexShrink: 0,
        }}
      >
        {stage.imageUrl ? (
          <img
            src={stage.imageUrl}
            alt=""
            aria-hidden
            className={`msg-photo${photoIn ? ' msg-photo--in' : ''}`}
            onLoad={() => setPhotoIn(true)}
            draggable={false}
          />
        ) : null}
        {stage.imageUrl ? <div className="msg-scrim" aria-hidden /> : null}

        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
              paddingBottom: 4,
              paddingLeft: 6,
              paddingRight: 6,
            }}
          >
            <button
              type="button"
              aria-label={t('a11y.back')}
              onClick={() => {
                // Prefer real back so we don't push a duplicate /messages entry
                // and trap the user in an inbox ↔ thread loop.
                if (window.history.length > 1) navigate(-1);
                else navigate('/messages', { replace: true });
              }}
              className="active:opacity-60"
              style={{
                width: 40,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: INK,
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <SquircleAvatar
                src={header.avatarUrl}
                userId={header.userId}
                alt={header.name}
                size={38}
                hairlineRing
              />
              <div className="flex flex-col min-w-0" style={{ gap: 1 }}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="truncate"
                    style={{ color: INK, fontSize: 16, fontWeight: 600, lineHeight: '19px', letterSpacing: '-0.012em' }}
                  >
                    {header.name}
                  </span>
                  {header.verified ? (
                    <BadgeCheck size={13} style={{ color: SUB, flexShrink: 0 }} />
                  ) : null}
                </div>
                {/* Rounds played together beats "last seen" every time. */}
                <span style={{ ...MT.CONTEXT }}>
                  {ground.count > 0
                    ? t('messaging:header.roundsTogether', {
                        count: ground.count,
                        defaultValue: `${ground.count} rounds together`,
                      })
                    : header.secondary}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label={t('a11y.more')}
              className="active:opacity-60"
              onClick={() => setSettingsOpen(true)}
              style={{
                width: 40,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: SUB,
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {/* §4.1 NO SHARED ROUNDS -> NO STRIP. */}
          {isDirect ? (
            <SharedGroundStrip ground={ground} rivalFirstName={rivalFirstName} />
          ) : null}
        </div>
      </header>

      <div className="flex-1 min-h-0" style={{ position: 'relative', zIndex: 0 }}>

        <div
          ref={scrollerRef}
          className="overflow-y-auto"
          style={{
            position: 'relative',
            height: '100%',
            padding: '8px 12px 12px 12px',
            paddingBottom: `calc(${composerHeight + keyboardHeight + 12}px + env(safe-area-inset-bottom, 0px))`,
            WebkitOverflowScrolling: 'touch',
          }}
        >
        {isLoading ? (
          <div className="flex flex-col">
            <SkeletonBubble side="left" w={55} />
            <SkeletonBubble side="right" w={40} />
            <SkeletonBubble side="left" w={65} />
            <SkeletonBubble side="right" w={35} />
            <SkeletonBubble side="left" w={45} />
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: '80px 24px', gap: 12 }}
          >
            <p style={{ color: INK, fontSize: 16, fontWeight: 500, margin: 0 }}>
              {t('messaging:error.couldntLoadThread')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full ec-glass--pill"
              style={{
                /* §6 AMBER IS THE VIEWING MEMBER — not a retry button. */
                color: INK,
                fontSize: 14,
                fontWeight: 600,

                padding: '8px 20px',
                border: 'none',
              }}
            >
              {t('common:action.retry')}
            </button>
          </div>
        ) : messages.length === 0 ? (
          (() => {
            const isGroup = (detail?.type ?? conv?.type) === 'group';
            const hasName = header.name && header.name !== 'Conversation' && header.name !== 'Unknown';
            // §4.5 THE EMPTY THREAD SAYS WHAT YOU HAVE IN COMMON. The golf you
            // have already played together is a better opener than "say hello".
            const commonGround =
              !isGroup && ground.count > 0 && ground.lastCourseName
                ? t('messaging:empty.threadCommonGround', {
                    name: rivalFirstName,
                    count: ground.count,
                    course: ground.lastCourseName,
                    defaultValue: `You and ${rivalFirstName} have played ${ground.count} rounds together, most recently at ${ground.lastCourseName}.`,
                  })
                : null;
            const subtitle =
              commonGround ??
              (isGroup
                ? hasName
                  ? t('messaging:empty.threadStartGroup', { name: header.name })
                  : t('messaging:empty.threadStartGroupGeneric')
                : hasName
                  ? t('messaging:empty.threadStartWith', { name: header.name })
                  : t('messaging:empty.threadStart'));
            return (
              /* ADDENDUM §1.4 — NO GENERIC GLYPH. The empty thread says what the
                 two of you have in common, or says plainly there are no
                 messages yet. It does not draw a speech bubble. */
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{ padding: '96px 24px', gap: 8 }}
              >
                <p
                  style={{
                    color: INK,
                    fontSize: 17,
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: '22px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('messaging:empty.sayHello')}
                </p>
                <p
                  style={{
                    color: SUB,
                    fontSize: 14,
                    margin: 0,
                    lineHeight: 1.5,
                    maxWidth: 260,
                  }}
                >
                  {subtitle}
                </p>
              </div>
            );

          })()
        ) : (
          <>
            {isFetchingOlder ? (
              <div
                className="flex justify-center"
                style={{ padding: '8px 0', color: HINT, fontSize: 12 }}
              >
                {t('common:state.loading')}
              </div>
            ) : null}
            {messages.map((m, i) => {
              const f = flags[i];
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOutgoing={f.isOutgoing}
                  isFirstOfRun={f.isFirstOfRun}
                  isLastOfRun={f.isLastOfRun}
                  showTicks={f.isOutgoing && i === lastOutgoingIndex}
                  onRetry={handleRetry}
                />
              );
            })}
            <div ref={bottomAnchorRef} />
          </>
        )}
        </div>
      </div>


      <Composer
        conversationId={conversationId}
        initialText={seededDraftRef.current}
        onHeightChange={setComposerHeight}
        onAfterSend={scrollToBottom}
      />

      <ConversationSettingsSheet
        open={settingsOpen}
        conversationId={conversationId}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default ThreadV2Page;

