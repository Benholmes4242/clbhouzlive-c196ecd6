import { memo } from 'react';
import { MapPin } from 'lucide-react';

interface PinProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light' | 'amber';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'grid';
}

/**
 * Pro Shop primitive — canonical badge/chip used across Watch, Clips and
 * Videos surfaces. The `dark` variant now uses the Discover glass recipe
 * (rgba(10,14,20,0.52) + backdrop blur + hairline border) and defaults to
 * a lucide MapPin icon, so updating it here propagates everywhere.
 */
function PinInner({ children, variant = 'dark', icon, size = 'md' }: PinProps) {
  const isLight = variant === 'light';
  const isAmber = variant === 'amber';
  const isCompact = size === 'sm';
  const isGrid = size === 'grid';
  const isDark = !isLight; // dark + amber both use dark scrim

  const background = isLight
    ? 'rgba(255,255,255,0.95)'
    : isAmber
    ? 'rgba(0,0,0,0.55)'
    : 'rgba(10,14,20,0.52)';
  const color = isLight
    ? '#0F172A'
    : isAmber
    ? '#F7931E'
    : 'rgba(255,255,255,0.95)';

  // For the dark variant: if caller passed no icon (or an emoji placeholder),
  // default to a white lucide MapPin so all surfaces share one chip language.
  let resolvedIcon = icon;
  const isEmojiIcon =
    !!icon &&
    typeof icon === 'object' &&
    'props' in (icon as any) &&
    typeof (icon as any).props?.children === 'string' &&
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test((icon as any).props.children);
  if (variant === 'dark' && (!icon || isEmojiIcon)) {
    resolvedIcon = <MapPin size={isGrid ? 10 : 11} color="#fff" strokeWidth={2.5} />;
  }

  const glassStyles =
    variant === 'dark'
      ? {
          backdropFilter: 'blur(14px) saturate(150%)',
          WebkitBackdropFilter: 'blur(14px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.16)',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)' as const,
        }
      : {};

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isCompact ? '0 7px' : isGrid ? '3px 7px' : '4px 8px',
        height: isCompact ? 18 : undefined,
        borderRadius: 9999,
        background,
        color,
        fontSize: isCompact ? 9 : isGrid ? 10 : 11,
        fontWeight: isAmber ? 700 : 600,
        lineHeight: 1.2,
        letterSpacing: isAmber ? '0.08em' : undefined,
        textTransform: isAmber ? 'uppercase' : undefined,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...glassStyles,
      }}
    >
      {resolvedIcon ? <span style={{ display: 'inline-flex', flexShrink: 0 }}>{resolvedIcon}</span> : null}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </div>
  );
}

export const Pin = memo(PinInner);

