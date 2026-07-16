import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flag, PencilLine, Sparkles, X } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { ConversationRow } from './ConversationRow';
import NewConversationSheet from './NewConversationSheet';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { safeLocalStorage } from '@/utils/safeLocalStorage';


const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const SLATE = '#0F172A';

const SkeletonRow: React.FC = () => (
  <div
    className="flex items-center gap-3"
    style={{
      padding: '12px 14px',
      minHeight: 72,
      borderBottom: `0.5px solid ${HAIRLINE}`,
      background: 'transparent',
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 18,
        background: '#E4E7EB',
      }}
    />
    <div className="flex-1 flex flex-col gap-2">
      <div style={{ height: 12, width: '40%', background: '#E4E7EB', borderRadius: 4 }} />
      <div style={{ height: 10, width: '70%', background: '#E4E7EB', borderRadius: 4 }} />
    </div>
  </div>
);

const Spinner: React.FC = () => (
  <div
    aria-label="Loading"
    style={{
      width: 22,
      height: 22,
      borderRadius: '50%',
      border: '2px solid #E4E7EB',
      borderTopColor: '#8A9099',
      animation: 'msg-spin 0.8s linear infinite',
    }}
  />
);

const InboxV2Page: React.FC = () => {
  const { t } = useTranslation(['messaging', 'common']);
  const navigate = useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);
  const { conversations, isLoading, error, refetch, hasActor } = useConversations();
  const actor = useMessagingActor();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!actor) return;
    const key = `clbhouz_bizmsg_earlyaccess_dismissed_${actor.actorId}`;
    if (safeLocalStorage.get(key) === 'true') {
      setBannerDismissed(true);
    }
  }, [actor]);


  const composeButton = (
    <button
      type="button"
      aria-label="New message"
      onClick={() => setComposeOpen(true)}
      className="active:opacity-60 transition-opacity"
      style={{
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        color: SUB,
      }}
    >
      <PencilLine size={20} />
    </button>
  );

  return (
    <div className="messages-root" style={{ background: CANVAS, color: INK }}>
      <div className="flex h-full w-full flex-col" style={{ background: CANVAS }}>
        <header
          className="z-30 flex-shrink-0"
          style={{
            background: CANVAS,
            borderBottom: `0.5px solid ${HAIRLINE}`,
          }}
        >
          <div
            className="flex items-center justify-between px-4"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
              paddingBottom: 12,
              minHeight: 56,
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="active:opacity-60"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid rgba(15,23,42,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: SLATE,
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: SLATE,
                  margin: 0,
                }}
              >
                {t('messaging:title.inbox')}
              </h1>
            </div>
            {composeButton}
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
      <div style={{ background: CANVAS, color: INK, minHeight: '100%' }}>
        <style>{`@keyframes msg-spin { to { transform: rotate(360deg); } }`}</style>

        {!hasActor ? (
          <div
            className="flex items-center justify-center"
            style={{ padding: '80px 24px' }}
          >
            <Spinner />
          </div>
        ) : isLoading ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: '80px 24px', gap: 12 }}
          >
            <p style={{ color: INK, fontSize: 16, fontWeight: 500, margin: 0 }}>
              Couldn't load messages
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full"
              style={{
                background: '#F7931E',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                padding: '8px 20px',
                border: 'none',
              }}
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: '80px 24px', gap: 24, flex: 1, position: 'relative', overflow: 'hidden' }}
          >
            <style>{`
              @keyframes inbox-ripple {
                0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.55; }
                80% { opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
              }
              @keyframes inbox-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes inbox-sheen {
                0% { transform: translateX(-120%); }
                60%, 100% { transform: translateX(120%); }
              }
              .inbox-ring {
                position: absolute;
                top: 50%; left: 50%;
                width: 150px; height: 150px;
                border: 1.5px solid rgba(15,23,42,0.10);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.6);
                animation: inbox-ripple 4.2s ease-out infinite;
                pointer-events: none;
              }
              .inbox-squircle { animation: inbox-float 3.6s ease-in-out infinite; }
              .inbox-sheen {
                position: absolute; inset: 0;
                background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.14) 50%, transparent 70%);
                animation: inbox-sheen 5s ease-in-out infinite;
                pointer-events: none;
              }
              @media (prefers-reduced-motion: reduce) {
                .inbox-ring { display: none; }
                .inbox-squircle { animation: none; }
                .inbox-sheen { display: none; }
              }
            `}</style>

            <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="inbox-ring" style={{ animationDelay: '0s' }} aria-hidden="true" />
              <span className="inbox-ring" style={{ animationDelay: '1.4s' }} aria-hidden="true" />
              <span className="inbox-ring" style={{ animationDelay: '2.8s' }} aria-hidden="true" />
              <div
                className="inbox-squircle"
                style={{
                  position: 'relative',
                  width: 62,
                  height: 62,
                  borderRadius: 20,
                  background: '#15171F',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Flag size={28} color="#FFFFFF" />
                <span className="inbox-sheen" aria-hidden="true" />
              </div>
            </div>

            <div className="flex flex-col items-center" style={{ gap: 8 }}>
              <p style={{ color: INK, fontSize: 21, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                Start the conversation
              </p>
              <p style={{ color: SUB, fontSize: 14, lineHeight: 1.5, maxWidth: 250, margin: 0 }}>
                Message golfers, clubs, or businesses - it all lands here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="active:opacity-60 transition-opacity"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#15171F',
                color: '#F5F6F7',
                borderRadius: 22,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
              }}
            >
              <PencilLine size={16} />
              New message
            </button>
          </div>

        ) : (
          <div>
            {actor?.actorType === 'business' && !bannerDismissed && (
              <div style={{ padding: '12px 16px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(247,147,30,0.09), rgba(247,147,30,0.05))',
                    border: '0.5px solid rgba(247,147,30,0.22)',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      background: '#F7931E',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={18} color="#FFFFFF" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#1F2428', lineHeight: 1.3 }}>
                      Business messaging
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#6B7280', lineHeight: 1.45 }}>
                      Message golfers directly.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => {
                      if (actor) {
                        safeLocalStorage.set(
                          `clbhouz_bizmsg_earlyaccess_dismissed_${actor.actorId}`,
                          'true',
                        );
                      }
                      setBannerDismissed(true);
                    }}
                    className="active:opacity-60 transition-opacity"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      color: '#AEB4BC',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            {conversations.map((c) => (
              <ConversationRow key={c.conversation_id} conversation={c} />
            ))}
          </div>
        )}
      </div>
        </div>

      <NewConversationSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
      </div>
    </div>
  );
};

export default InboxV2Page;
