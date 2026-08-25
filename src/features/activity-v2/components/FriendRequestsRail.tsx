import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriendRequestsV2, type FriendRequestRowV2 } from '../hooks/useFriendRequestsV2';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
// §4.1 Four light literals declared beside a component whose page went dark.
import { ACT } from './ledgerKinds';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const INK = ACT.INK;
const INK_60 = ACT.INK_60;
const AMBER_DEEP = ACT.AMBER_DEEP;
const HAIR = ACT.HAIR;

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
        background: A.PANEL,
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
            // §4.1 :59 is the AVATAR FALLBACK ground, shown when a requester has
            // no photo — a light fill becomes a dark placeholder.
            : ACT.NEUTRAL,
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
            // §2.2 case: the label follows the inverted ink fill.
            color: ACT.CANVAS,
            // CAPS button: tracked out at 0.10em, stepped down to the READ floor
            // (11, not 10.5 — the floor holds), padding unchanged so height holds.
            fontSize: 11,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
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
            background: 'transparent',
            color: INK_60,
            // CAPS button, as Accept.
            fontSize: 11,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontWeight: 700,
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
                // READ 11 floor (rail eyebrow).
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: ACT.INK_45,
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
