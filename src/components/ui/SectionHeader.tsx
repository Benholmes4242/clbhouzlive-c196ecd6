/**
 * Canonical SectionHeader — three tiers (editorial / standard / rail).
 * Minimal density: icon mark tile appears on EDITORIAL only.
 * Surface-agnostic: self-contained tokens, couples to no feature.
 */
import { memo, type ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const AMBER = '#F7931E';
const AMBER_AA = '#c97a10'; // AA-safe amber for caps eyebrows on white
const INK = '#0F172A';
const INK_MUTE = '#64748B';

type Tier = 'editorial' | 'standard' | 'rail';
type IconTone = 'amber' | 'ink';

interface SectionHeaderProps {
  tier?: Tier;
  /** Caps kicker above the title (editorial) OR the caps label itself (standard). */
  kicker?: string;
  /** Main title. */
  title?: string;
  /** Secondary line under the title. */
  sub?: string;
  /** Icon — renders ONLY on the editorial tier. Ignored otherwise. */
  icon?: LucideIcon;
  /** Mark tile tone (editorial only). */
  iconTone?: IconTone;
  /** Bespoke mark node (editorial only) — overrides the generic icon tile. */
  mark?: ReactNode;
  /** Right-side action affordance. */
  action?: { label: string; onClick: () => void };
  paddingTop?: number;
  paddingX?: number;
  className?: string;
}

function ActionAffordance({
  action,
  color = INK,
}: {
  action: { label: string; onClick: () => void };
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontFamily: GEIST,
        fontSize: 13,
        fontWeight: 700,
        color,
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {action.label}
      <ChevronRight size={14} strokeWidth={2.5} style={{ marginTop: 1 }} />
    </button>
  );
}

function SectionHeaderInner(props: SectionHeaderProps) {
  const {
    tier = 'standard',
    kicker,
    title,
    sub,
    icon: Icon,
    iconTone = 'amber',
    mark,
    action,
    paddingTop = 0,
    paddingX = 0,
    className,
  } = props;

  const pad = { paddingTop, paddingLeft: paddingX, paddingRight: paddingX };

  // ── TIER 3 · RAIL ──
  if (tier === 'rail') {
    return (
      <div
        className={className}
        style={{
          ...pad,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: GEIST,
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: INK,
          }}
        >
          {title}
        </h3>
        {action && <ActionAffordance action={action} />}
      </div>
    );
  }

  // ── TIER 2 · STANDARD (amber eyebrow, NO icon) ──
  if (tier === 'standard') {
    const eyebrowText = kicker ?? title;
    return (
      <div className={className} style={{ ...pad, marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: GEIST,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER_AA,
            }}
          >
            {eyebrowText}
          </span>
          {action && <ActionAffordance action={action} />}
        </div>
        {kicker && title && (
          <h3
            style={{
              margin: '6px 0 0 0',
              fontFamily: GEIST,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: INK,
            }}
          >
            {title}
          </h3>
        )}
        {sub && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontFamily: GEIST,
              fontSize: 13,
              fontWeight: 500,
              color: INK_MUTE,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    );
  }

  // ── TIER 1 · EDITORIAL ──
  const markBg =
    iconTone === 'ink'
      ? 'linear-gradient(135deg,#0F172A 0%,#1e293b 100%)'
      : AMBER;
  const markShadow =
    iconTone === 'ink'
      ? '0 4px 10px -2px rgba(15,23,42,0.30)'
      : '0 4px 10px -2px rgba(247,147,30,0.40)';

  const markNode =
    mark ??
    (Icon && (
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 12,
          background: markBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: markShadow,
        }}
      >
        <Icon size={20} strokeWidth={2.25} color="#FFFFFF" />
      </div>
    ));

  return (
    <div
      className={className}
      style={{
        ...pad,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14,
      }}
    >
      {markNode}
      <div style={{ flex: 1, minWidth: 0 }}>
        {kicker && (
          <div
            style={{
              fontFamily: GEIST,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER_AA,
              marginBottom: 2,
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: GEIST,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.015em',
              color: INK,
              lineHeight: 1.15,
            }}
          >
            {title}
          </h2>
          {action && <ActionAffordance action={action} />}
        </div>
        {sub && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontFamily: GEIST,
              fontSize: 13,
              fontWeight: 500,
              color: INK_MUTE,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export const SectionHeader = memo(SectionHeaderInner);
export default SectionHeader;
