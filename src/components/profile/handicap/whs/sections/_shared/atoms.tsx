import React from 'react';
import { Sparkles } from 'lucide-react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const CREAM = '#FFFBF5';

/**
 * Section header — primary pattern for introducing a section.
 * Amber tab marker + AMBER EYEBROW + bold title + optional sub.
 */
export interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  sub,
  right,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 20px 12px',
      fontFamily: FONT,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 3,
            height: 8,
            borderRadius: 1,
            background: AMBER,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: AMBER,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 900,
          fontFamily: FONT,
          letterSpacing: '-0.035em',
          lineHeight: 1.08,
          color: INK,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: INK_55,
            margin: '4px 0 0',
          }}
        >
          {sub}
        </p>
      )}
    </div>
    {right && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

/**
 * Inline card header — used INSIDE cards/widgets that need an
 * icon-square + title + sub + right-slot row.
 */
export interface InlineCardHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

export const InlineCardHeader: React.FC<InlineCardHeaderProps> = ({
  icon,
  iconBg,
  title,
  sub,
  right,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderBottom: `0.5px solid ${HAIRLINE}`,
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: INK_55,
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
    {right && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

/**
 * Echo callout — the AI voice. ONE treatment everywhere.
 * Cream background + 2px amber gradient rail at top + sparkle icon square
 * + ECHO ON {CONTEXT} eyebrow + body paragraph.
 */
export interface EchoCalloutProps {
  context: string;
  body: React.ReactNode;
  marginBottom?: number;
}

export const EchoCallout: React.FC<EchoCalloutProps> = ({
  context,
  body,
  marginBottom = 0,
}) => (
  <div
    style={{
      position: 'relative',
      background: CREAM,
      border: `0.5px solid ${HAIRLINE}`,
      borderRadius: 14,
      padding: 14,
      paddingTop: 16,
      marginBottom,
      fontFamily: FONT,
      overflow: 'hidden',
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${AMBER} 0%, ${AMBER_DEEP} 100%)`,
      }}
    />
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: AMBER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Sparkles size={16} color="#fff" strokeWidth={2.25} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: AMBER_DEEP,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 6,
            fontFamily: FONT,
          }}
        >
          ECHO ON {context}
        </div>
        <div
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            color: INK,
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  </div>
);
