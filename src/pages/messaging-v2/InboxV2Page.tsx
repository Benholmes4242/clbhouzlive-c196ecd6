import React, { useState } from 'react';
import { Flag, PencilLine } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { ConversationRow } from './ConversationRow';
import NewConversationSheet from './NewConversationSheet';
import { ManagePageShell } from '@/components/manage/ManagePageShell';


const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';

const SkeletonRow: React.FC = () => (
  <div
    className="flex items-center gap-3"
    style={{
      padding: '11px 14px',
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
  const [composeOpen, setComposeOpen] = useState(false);
  const { conversations, isLoading, error, refetch, hasActor } = useConversations();


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
    <ManagePageShell title="Messages" right={composeButton}>
      <div style={{ background: CANVAS, color: INK, minHeight: '100%' }}>
        <style>{`@keyframes msg-spin { to { transform: rotate(360deg); } }`}</style>

        {!hasActor ? (
          <div
            className="flex items-center justify-center"
            style={{ padding: '96px 24px' }}
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
            style={{ padding: '96px 24px', gap: 20, flex: 1 }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: '#EDEFF2',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={30} color="#8A9099" />
            </div>
            <div className="flex flex-col items-center" style={{ gap: 6 }}>
              <p style={{ color: INK, fontSize: 19, fontWeight: 600, margin: 0, lineHeight: '24px' }}>
                No messages yet
              </p>
              <p
                style={{
                  color: SUB,
                  fontSize: 14,
                  lineHeight: 1.45,
                  maxWidth: 260,
                  margin: 0,
                }}
              >
                Start a conversation with a golfer or group and it'll show up here.
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
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
              }}
            >
              <PencilLine size={16} />
              Start a conversation
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((c) => (
              <ConversationRow key={c.conversation_id} conversation={c} />
            ))}
          </div>
        )}
      </div>

      <NewConversationSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
    </ManagePageShell>
  );
};

export default InboxV2Page;
