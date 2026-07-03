import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BIZ } from '@/components/business/businessTokens';

export function VerificationNudgeSection() {
  return (
    <div className="px-4 pt-2 pb-4">
      <div
        style={{
          borderRadius: 16,
          padding: 14,
          background: 'rgba(247,147,30,0.08)',
          border: `1px solid rgba(247,147,30,0.24)`,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(247,147,30,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} style={{ color: BIZ.amber }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground">Get verified after you create</p>
          <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
            Claim and verify your business to earn the verified badge, build trust,
            and unlock insights. You can start this once your profile is live.
          </p>
        </div>
      </div>
    </div>
  );
}
