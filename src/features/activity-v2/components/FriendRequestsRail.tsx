import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriendRequestsV2, type FriendRequestRowV2 } from '../hooks/useFriendRequestsV2';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_60 = '#475569';
const AMBER_DEEP = '#C97A10';
const HAIR = 'rgba(15,23,42,0.10)';

function initialsOf(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

interface CardProps {
  row: FriendRequestRowV2;
  pending: boolean;
  onOpen: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const RequestCard: React.FC<CardProps> = ({ row, pending, onOpen, onAccept, onDecline }) => {
  const name = row.requester_display_name || row.requester_username || 'Golfer';
  const mutual = row.mutual_friend_count;
  const mutualLine =
    mutual > 0 ? `${mutual} mutual friend${mutual === 1 ? '' : 's'}` : null;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      style={{
        width: 210,
        flexShrink: 0,
        background: '#FFFFFF',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '36%',
          background: row.requester_avatar_url
            ? `url(${row.requester_avatar_url}) center/cover`
            : '#E2E8F0',
          border: `1px solid ${HAIR}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: AMBER_DEEP,
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {!row.requester_avatar_url && initialsOf(name)}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.2,
          marginBottom: mutualLine ? 2 : 12,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {name}
      </div>
      {mutualLine && (
        <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_60, marginBottom: 12 }}>
          {mutualLine}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, width: '100%' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onAccept(); }}
          disabled={pending}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 20,
            background: INK,
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            cursor: pending ? 'default' : 'pointer',
            opacity: pending ? 0.6 : 1,
            fontFamily: SF_STACK,
          }}
        >
          {pending ? '…' : 'Accept'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDecline(); }}
          disabled={pending}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 20,
            background: '#FFFFFF',
            color: INK_60,
            fontSize: 12.5,
            fontWeight: 600,
            border: `1px solid ${HAIR}`,
            cursor: pending ? 'default' : 'pointer',
            opacity: pending ? 0.6 : 1,
            fontFamily: SF_STACK,
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export const FriendRequestsRail: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: rows,
    isLoading,
    acceptRequest,
    declineRequest,
  } = useFriendRequestsV2();

  const show = !isLoading && !!rows && rows.length > 0;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="friend-requests-rail"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <section style={{ padding: '18px 0 6px', fontFamily: SF_STACK }}>
            <div
              style={{
                padding: '0 16px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#94A3B8',
              }}
            >
              Friend requests · {rows!.length}
            </div>
            <div
              className="flex gap-2.5 overflow-x-auto scrollbar-none"
              style={{ padding: '0 16px 4px' }}
            >
              {rows!.map((r) => {
                const pending =
                  (acceptRequest.isPending && acceptRequest.variables?.requestId === r.request_id) ||
                  (declineRequest.isPending && declineRequest.variables?.requestId === r.request_id);
                return (
                  <RequestCard
                    key={r.request_id}
                    row={r}
                    pending={pending}
                    onOpen={() =>
                      navigate(
                        r.requester_username
                          ? `/user/${r.requester_username}`
                          : `/profile/${r.requester_user_id}`,
                      )
                    }
                    onAccept={() =>
                      acceptRequest.mutate({
                        requestId: r.request_id,
                        requesterId: r.requester_user_id,
                      })
                    }
                    onDecline={() =>
                      declineRequest.mutate({
                        requestId: r.request_id,
                        requesterId: r.requester_user_id,
                      })
                    }
                  />
                );
              })}
            </div>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendRequestsRail;
