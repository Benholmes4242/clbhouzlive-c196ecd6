import React, { useRef } from 'react';
import { useCollegeMediaByName } from '@/hooks/useCollegeMediaSearch';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';

interface CollegeStampProps {
  normalizedName: string;
  className?: string;
  /** If provided, shows a dot divider before the college stamp */
  withDivider?: boolean;
  /** 'alumni' for attended college, 'supporter' for followed-only, 'player' for tour players */
  variant?: 'alumni' | 'supporter' | 'player';
  /**
   * TC1: name to render when no college_media row exists for this player's
   * college. Without it the stamp stays silent, which is right on member
   * profiles but would drop a known fact on a tour player.
   */
  fallbackName?: string | null;
  /** Graduation / class year, rendered only when known. */
  year?: number | string | null;
  /** Light surfaces (member profile) vs dark surfaces (tour player hero). */
  tone?: 'light' | 'dark';
  /**
   * TC1 instrumentation. Fired on tap and on long-press even though the stamp
   * does not navigate: it is the only reading of whether the college is
   * interesting where it now lives.
   */
  onActivate?: (mode: 'tap' | 'longpress') => void;
}

const LONG_PRESS_MS = 500;

/**
 * Displays a small college badge with logo, short name, and a role label.
 * Shows a fallback letter if the logo is missing.
 */
export const CollegeStamp: React.FC<CollegeStampProps> = ({
  normalizedName,
  className = '',
  withDivider = false,
  variant = 'alumni',
  fallbackName = null,
  year = null,
  tone = 'light',
  onActivate,
}) => {
  const { data: college, isLoading } = useCollegeMediaByName(normalizedName);
  const pressTimer = useRef<number | null>(null);
  const firedLongPress = useRef(false);

  if (isLoading && !fallbackName) return null;
  if (!college && !fallbackName) return null;

  const displayName = college?.short_name || college?.college_name || fallbackName || '';
  if (!displayName) return null;

  const firstLetter = displayName.charAt(0).toUpperCase() || 'C';
  const isSupporter = variant === 'supporter';
  const isPlayer = variant === 'player';
  const isDark = tone === 'dark';
  const logoUrl = getCollegeLogoUrl(college?.college_name || fallbackName || undefined);

  const nameColor = isDark
    ? 'rgba(255,255,255,0.92)'
    : isSupporter
      ? 'rgba(0,0,0,0.5)'
      : undefined;
  const metaColor = isDark
    ? 'rgba(255,255,255,0.55)'
    : isSupporter
      ? 'rgba(0,0,0,0.35)'
      : 'rgba(0,0,0,0.45)';

  const clearTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const interactive = !!onActivate;
  const pressProps = interactive
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onPointerDown: () => {
          firedLongPress.current = false;
          clearTimer();
          pressTimer.current = window.setTimeout(() => {
            firedLongPress.current = true;
            onActivate?.('longpress');
          }, LONG_PRESS_MS);
        },
        onPointerUp: clearTimer,
        onPointerLeave: clearTimer,
        onPointerCancel: clearTimer,
        onClick: () => {
          clearTimer();
          if (firedLongPress.current) {
            firedLongPress.current = false;
            return;
          }
          onActivate?.('tap');
        },
      }
    : {};

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      title={isSupporter ? 'College supporter' : 'College alumni badge'}
      {...pressProps}
    >
      {withDivider && <span className="text-muted-foreground/40 mx-1">·</span>}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${displayName} logo`}
          className="w-5 h-5 rounded-full object-contain bg-background"
          style={{ opacity: isSupporter ? 0.7 : 1 }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">{firstLetter}</span>
        </div>
      )}
      <span
        className="text-sm"
        style={{
          fontWeight: isSupporter ? 500 : 600,
          color: nameColor,
          fontSize: '11px',
        }}
      >
        {displayName}
      </span>
      {isPlayer ? (
        year ? (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: metaColor,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            · {year}
          </span>
        ) : null
      ) : (
        <span
          style={{
            fontSize: '10px',
            fontWeight: isSupporter ? 500 : 600,
            color: metaColor,
          }}
        >
          · {isSupporter ? 'Supporter' : 'Alumni'}
        </span>
      )}
    </div>
  );
};

export default CollegeStamp;
