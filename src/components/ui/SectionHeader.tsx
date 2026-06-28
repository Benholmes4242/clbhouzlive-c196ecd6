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
type Role = 'prime' | 'section' | 'rail';
type IconTone = 'amber' | 'ink';
type EyebrowTone = 'slate' | 'amber' | 'danger';

// Canonical mapping: legacy tiers map onto the role vocabulary.
const TIER_TO_ROLE: Record<Tier, Role> = {
  editorial: 'prime',
  standard: 'section',
  rail: 'rail',
};

const EYEBROW_TONE: Record<EyebrowTone, string> = {
  slate: '#64748B',
  amber: '#c97a10',
  danger: '#DC2626',
};

interface SectionHeaderProps {
  tier?: Tier;
  /** Canonical role vocabulary (per docs/canonical/section-titles.md). Maps onto tier. */
  role?: Role;
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
  /** Tier-2 eyebrow colour. 'slate' default (#64748B) | 'amber' (#c97a10) | 'danger' (#DC2626). */
  tone?: EyebrowTone;
  /** Optional inline count rendered after the eyebrow (slate-400, tabular). */
  count?: number;
  /** Render an amber required asterisk after the eyebrow label. */
  required?: boolean;
  /** Render the `icon` as a small inline glyph before a standard-tier eyebrow (SectionLabel parity). */
  inlineIcon?: boolean;
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
    tier: tierProp,
    role: roleProp,
    kicker,
    title,
    sub,
    icon: Icon,
    action,
    tone,
    count,
    required,
    inlineIcon,
    paddingTop = 0,
    paddingX = 0,
    className,
  } = props;

  const role: Role = roleProp ?? TIER_TO_ROLE[tierProp ?? 'standard'];

  const pad = { paddingTop, paddingLeft: paddingX, paddingRight: paddingX };

  // ── RAIL ── (no cut-line)
  if (role === 'rail') {
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

  // ── PRIME / SECTION ── share the cut-line signature.
  const isPrime = role === 'prime';
  const titleSize = isPrime ? 26 : 20;
  const titleTracking = isPrime ? '-0.02em' : '-0.02em';
  const cutWidth = isPrime ? 34 : 22;
  const cutHeight = isPrime ? 3 : 2;
  const defaultEyebrowColor = isPrime ? AMBER_AA : '#94A3B8';
  const eyebrowColor = tone ? EYEBROW_TONE[tone] : defaultEyebrowColor;

  return (
    <div className={className} style={{ ...pad, marginBottom: 14 }}>
      {kicker && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: GEIST,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: eyebrowColor,
            fontFeatureSettings: '"kern" 1, "liga" 1',
            marginBottom: 5,
          }}
        >
          {inlineIcon && Icon && (
            <Icon size={11} strokeWidth={2.4} color={eyebrowColor} />
          )}
          {kicker}
          {required && (
            <span aria-hidden="true" style={{ color: AMBER, marginLeft: 3, letterSpacing: 0 }}>
              *
            </span>
          )}
          {count != null && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: GEIST,
                fontSize: 11,
                fontWeight: 800,
                color: '#94A3B8',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 0,
              }}
            >
              {count.toLocaleString()}
            </span>
          )}
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
            fontSize: titleSize,
            fontWeight: 800,
            letterSpacing: titleTracking,
            color: INK,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        {action && <ActionAffordance action={action} />}
      </div>
      <div
        aria-hidden="true"
        style={{
          marginTop: 7,
          width: cutWidth,
          height: cutHeight,
          background: AMBER,
          borderRadius: cutHeight,
        }}
      />
      {sub && (
        <p
          style={{
            margin: '8px 0 0 0',
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

export const SectionHeader = memo(SectionHeaderInner);
export default SectionHeader;
