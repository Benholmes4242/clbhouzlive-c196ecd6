import { useNavigate } from 'react-router-dom';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { SPACE } from '@/lib/spacing';

export default function DiscoverWhsMasthead() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading } = useWhsConnection(user?.id);
  const isSynced = !!connection;
  const showSyncLink = !isLoading && !isSynced;

  return (
    <div style={{ padding: `20px ${SPACE.pagePadX}px 16px` }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#c97a10',
          marginBottom: SPACE.eyebrowTitle,
        }}
      >
        OFFICIAL WHS · GLOBAL
      </div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#0F172A',
          lineHeight: 1.12,
          margin: 0,
        }}
      >
        Earn your place on the board
      </h2>
      <div
        style={{
          fontSize: 12.5,
          color: '#64748B',
          lineHeight: 1.55,
          marginTop: 11,
        }}
      >
        Every score here comes from an official World Handicap System handicap - verified rounds only, from players worldwide. Nothing manual, no inflated numbers.
      </div>
      {showSyncLink ? (
        <button
          type="button"
          onClick={() => navigate('/handicap')}
          style={{
            marginTop: 12,
            padding: 0,
            border: 'none',
            background: 'transparent',
            fontSize: 12.5,
            fontWeight: 800,
            color: '#F7931E',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Sync your WHS handicap ›
        </button>
      ) : null}
    </div>
  );
}
