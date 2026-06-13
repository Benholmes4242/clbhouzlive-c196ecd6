import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, Ban, Building2,
} from 'lucide-react';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import {
  INK, INK_SOFT, INK_SUBTLE,
  BORDER, SURFACE,
  REVEAL, CARD_RADIUS,
} from './tokens';

interface Props {
  notification: ActivityNotification;
  onClick: () => void;
}

function iconFor(type: string) {
  if (type.endsWith('_approved') || type === 'business_access_approved') return CheckCircle2;
  if (type.endsWith('_rejected') || type.endsWith('_removed') || type.endsWith('_revoked') || type === 'business_access_declined') return Ban;
  if (type === 'business_member_added') return Building2;
  return Clock;
}

function toneFor(type: string): { fg: string; bg: string } {
  if (type.endsWith('_approved') || type === 'business_access_approved') return { fg: '#16A34A', bg: 'rgba(22,163,74,0.10)' };
  if (type.endsWith('_rejected') || type.endsWith('_removed') || type.endsWith('_revoked') || type === 'business_access_declined') return { fg: '#DC2626', bg: 'rgba(220,38,38,0.08)' };
  return { fg: '#475569', bg: 'rgba(15,23,42,0.05)' };
}

export const StatusRow: React.FC<Props> = ({ notification, onClick }) => {
  const Icon = iconFor(notification.type);
  const tone = toneFor(notification.type);
  const title = notification.title || 'Update';
  const detail = notification.message;

  return (
    <motion.button
      {...REVEAL}
      type="button"
      onClick={onClick}
      className="w-full text-left active:bg-black/[0.02] transition-colors flex items-start gap-3"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: '12px 14px',
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 10, background: tone.bg }}
      >
        <Icon size={18} color={tone.fg} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold leading-[1.3] truncate" style={{ color: INK }}>
          {title}
        </p>
        {detail && (
          <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: INK_SOFT }}>
            {detail}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[11px] font-medium tabular-nums" style={{ color: INK_SUBTLE }}>
        {notification.time_ago}
      </span>
    </motion.button>
  );
};
