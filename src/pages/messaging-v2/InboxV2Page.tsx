import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilLine } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { ConversationRow } from './ConversationRow';

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
        background: '#EEF0F2',
      }}
    />
    <div className="flex-1 flex flex-col gap-2">
      <div style={{ height: 12, width: '40%', background: '#EEF0F2', borderRadius: 4 }} />
      <div style={{ height: 10, width: '70%', background: '#EEF0F2', borderRadius: 4 }} />
    </div>
  </div>
);

const InboxV2Page: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, isLoading, error, refetch } = useConversations();

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: '#FFFFFF', color: INK }}
    >
      <header
        className="sticky top-0 z-10"
        style={{
          background: '#FFFFFF',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: `1px solid ${HAIRLINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 500, color: INK, margin: 0 }}>
          Messages
        </h1>
        <button
          type="button"
          aria-label="New message"
          onClick={() => navigate('/messages-v2')}
          className="active:opacity-60 transition-opacity"
          style={{
            width: 36,
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: INK,
          }}
        >
          <PencilLine size={20} />
        </button>
      </header>

      <main>
        {isLoading ? (
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
            style={{ padding: '96px 24px', gap: 8 }}
          >
            <p style={{ color: INK, fontSize: 17, fontWeight: 500, margin: 0 }}>
              No messages yet
            </p>
            <p style={{ color: SUB, fontSize: 14, margin: 0 }}>
              Start a conversation with a friend or group.
            </p>
          </div>
        ) : (
          <div>
            {conversations.map((c) => (
              <ConversationRow key={c.conversation_id} conversation={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InboxV2Page;
