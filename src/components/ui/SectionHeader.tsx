/**
 * Canonical SectionHeader — three tiers (editorial / standard / rail).
 * Minimal density: icon mark tile appears on EDITORIAL only.
 * Surface-agnostic: self-contained tokens, couples to no feature.
 */
import { memo, type ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { formatNumber } from '@/i18n/format';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { BAND_RED_DARK } from '@/features/courses/_shared/scoreBands';


const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
/**
 * EYEBROW INK FLIP (retired): the prime eyebrow used to flip from amber to a
 * near-black ink because small amber text failed contrast on WHITE. The canvas
 * is dark-only now, so the reasoning inverts — near-black is the failing value
 * and amber is the legible one. The eyebrow is plain A.AMBER.
 */

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
  slate: A.MUTE,
  amber: A.AMBER,
  danger: BAND_RED_DARK,
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
  /** Non-interactive right-aligned caps text (e.g. "FRI 19 JUN", "SCORE DIFF VS HCP"). */
  meta?: ReactNode;
  /** Tier-2 eyebrow colour. 'slate' default (A.MUTE) | 'amber' (A.AMBER) | 'danger' (BAND_RED_DARK). */
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
  /**
   * Surface theme. Default 'light' (white surfaces, ink title, slate eyebrow).
   * 'dark' uses --hcp-* theme tokens for eyebrow/title; cut-line stays amber.
   */
  surface?: 'light' | 'dark';
  /**
   * Accent colour for the eyebrow + cut-line. Defaults to amber.
   * Reserved for pure-data surfaces that align the header to a semantic scale
   * (e.g. Holes tab passes red #D2222D = SC_BIRDIE). Must be AA-safe on the surface.
   * See docs/canonical/section-titles.md "Accent exception".
   */
  accent?: string;
  /** When false, suppresses the coloured cut-line under the title. Defaults to true. */
  cutLine?: boolean;
}

function ActionAffordance({
  action,
  color = A.MUTE,
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
        fontFamily: SF_STACK,
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

function MetaSlot({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: SF_STACK,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-40, rgba(248,250,252,0.62))',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"kern" 1, "liga" 1',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
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
    meta,
    tone,
    count,
    required,
    inlineIcon,
    paddingTop = 0,
    paddingX = 0,
    className,
    accent,
    surface = 'light',
    cutLine = true,
  } = props;

  const role: Role = roleProp ?? TIER_TO_ROLE[tierProp ?? 'standard'];
  const isDark = surface === 'dark';
  const titleColor = isDark ? 'var(--hcp-t-100)' : A.INK;
  const subColor = isDark ? 'var(--hcp-t-60)' : A.BODY;

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
            fontFamily: SF_STACK,
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: titleColor,
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
  const defaultEyebrowColor = isPrime
    ? A.AMBER
    : isDark
      ? 'var(--hcp-t-60)'
      : A.MUTE;
  const eyebrowColor = accent ?? (tone ? EYEBROW_TONE[tone] : defaultEyebrowColor);
  const cutColor = accent ?? A.AMBER;

  const hasTitle = Boolean(title);

  return (
    <div className={className} style={{ ...pad, marginBottom: 14 }}>
      {kicker && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 5,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: SF_STACK,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: eyebrowColor,
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {inlineIcon && Icon && (
              <Icon size={11} strokeWidth={2.4} color={eyebrowColor} />
            )}
            {kicker}
            {required && (
              <span aria-hidden="true" style={{ color: A.AMBER, marginLeft: 3, letterSpacing: 0 }}>
                *
              </span>
            )}
            {count != null && (
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: SF_STACK,
                  fontSize: 11,
                  fontWeight: 700,
                  color: A.MUTE,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: 0,
                }}
              >
                {formatNumber(count)}
              </span>
            )}
          </div>
          {!hasTitle && action && <ActionAffordance action={action} />}
          {!hasTitle && !action && meta && <MetaSlot>{meta}</MetaSlot>}
        </div>
      )}
      {hasTitle && (
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
              fontFamily: SF_STACK,
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: titleTracking,
              color: titleColor,
              lineHeight: 1.15,
            }}
          >
            {title}
          </h2>
          {action ? <ActionAffordance action={action} /> : meta ? <MetaSlot>{meta}</MetaSlot> : null}
        </div>
      )}

      {/* Amber cut-line removed app-wide per design directive. */}
      {false && cutLine && (
        <div
          aria-hidden="true"
          style={{
            marginTop: 7,
            width: cutWidth,
            height: cutHeight,
            background: cutColor,
            borderRadius: cutHeight,
          }}
        />
      )}
      {sub && (
        <p
          style={{
            margin: '8px 0 0 0',
            fontFamily: SF_STACK,
            fontSize: 13,
            fontWeight: 500,
            color: subColor,
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
