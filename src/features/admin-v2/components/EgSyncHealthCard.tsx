import React from 'react';
import { Link2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EgSyncHealth, EgSyncStatus } from '../hooks/useAdminV2Dashboard';

interface Props {
  data: EgSyncHealth | undefined;
  isLoading: boolean;
  isError: boolean;
}

const STATUS_CONFIG: Record<EgSyncStatus, {
  label: string;
  bg: string;
  border: string;
  dot: string;
  text: string;
  Icon: React.ElementType;
}> = {
  green: {
    label: 'Healthy',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.20)',
    dot: '#059669',
    text: '#047857',
    Icon: CheckCircle2,
  },
  amber: {
    label: 'Stale',
    bg: 'rgba(247,147,30,0.06)',
    border: 'rgba(247,147,30,0.20)',
    dot: '#F7931E',
    text: '#9A6116',
    Icon: Clock,
  },
  red: {
    label: 'Broken',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.20)',
    dot: '#DC2626',
    text: '#B91C1C',
    Icon: AlertTriangle,
  },
  idle: {
    label: 'No users',
    bg: 'rgba(15,23,42,0.04)',
    border: 'rgba(15,23,42,0.10)',
    dot: '#94A3B8',
    text: '#64748B',
    Icon: Link2,
  },
};

const Stat: React.FC<{ label: string; value: string; tone?: 'default' | 'red'; small?: boolean }> = ({
  label,
  value,
  tone = 'default',
  small = false,
}) => (
  <div>
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: '#94A3B8',
        letterSpacing: '0.16em',
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: small ? 11 : 16,
        fontWeight: 700,
        color: tone === 'red' ? '#B91C1C' : '#0F172A',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {value}
    </div>
  </div>
);

export const EgSyncHealthCard: React.FC<Props> = ({ data, isLoading, isError }) => {
  if (isLoading) {
    return (
      <div
        className="animate-pulse"
        style={{
          height: 110,
          background: 'rgba(15,23,42,0.04)',
          borderRadius: 12,
        }}
      />
    );
  }

  if (isError || !data) {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(220,38,38,0.04)',
          border: '0.5px solid rgba(220,38,38,0.20)',
          fontSize: 13,
          color: '#B91C1C',
        }}
      >
        Couldn't load sync health.
      </div>
    );
  }

  const cfg = STATUS_CONFIG[data.status];
  const cronLastRun = data.cron_last_run_at
    ? formatDistanceToNow(new Date(data.cron_last_run_at), { addSuffix: true })
    : 'Never';

  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: '#FFFFFF',
        border: `0.5px solid rgba(15,23,42,0.10)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link2 size={16} color="#0F172A" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            England Golf Sync
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: cfg.bg,
            border: `0.5px solid ${cfg.border}`,
            borderRadius: 999,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.text, letterSpacing: '0.04em' }}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        <Stat label="CONNECTED" value={String(data.total_connected)} />
        <Stat
          label="AUTH FAILED"
          value={String(data.auth_failed)}
          tone={data.auth_failed > 0 ? 'red' : 'default'}
        />
        <Stat
          label="FAILS"
          value={String(data.consecutive_failures_total)}
          tone={data.consecutive_failures_total > 0 ? 'red' : 'default'}
        />
        <Stat label="CRON RAN" value={cronLastRun} small />
      </div>
    </div>
  );
};

export default EgSyncHealthCard;
