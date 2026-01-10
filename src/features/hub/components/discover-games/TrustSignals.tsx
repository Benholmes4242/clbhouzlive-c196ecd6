/**
 * TrustSignals - Subtle trust indicators for discover cards
 * 
 * Shows:
 * - "Verified" pill if host is verified
 * - "Handicap hidden" if host hides their handicap
 * - "Home club hidden" if host hides their home club
 */

import React from 'react';
import { ShieldCheck, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustSignalsProps {
  isVerified?: boolean;
  showsHandicap?: boolean;
  showsHomeClub?: boolean;
  className?: string;
}

export function TrustSignals({
  isVerified,
  showsHandicap = true,
  showsHomeClub = true,
  className,
}: TrustSignalsProps) {
  const signals: Array<{ icon: React.ElementType; label: string; variant: 'positive' | 'neutral' }> = [];

  if (isVerified) {
    signals.push({ icon: ShieldCheck, label: 'Verified', variant: 'positive' });
  }

  if (!showsHandicap) {
    signals.push({ icon: EyeOff, label: 'Handicap hidden', variant: 'neutral' });
  }

  if (!showsHomeClub) {
    signals.push({ icon: EyeOff, label: 'Home club hidden', variant: 'neutral' });
  }

  if (signals.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {signals.map(({ icon: Icon, label, variant }) => (
        <span
          key={label}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            variant === 'positive' 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="w-2.5 h-2.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
