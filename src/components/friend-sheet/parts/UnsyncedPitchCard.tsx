import React from 'react';
import { AMBER, BG_1, T100, T60, LINE, FONT } from './_shared/tokens';

interface Perk {
  icon: React.ReactNode;
  title: string;
  sub: string;
}

interface Props {
  firstName: string;
  headline: string;
  subCopy: string;
  eyebrow: string;
  perks?: Perk[];
}

const DEFAULT_PERKS: Perk[] = [
  { icon: <ArrowsExchangeIcon />, title: 'Head-to-heads', sub: 'Compare on shared rounds' },
  { icon: <TrendUpIcon />, title: 'Form & trends', sub: 'Handicaps side by side' },
  { icon: <TrophyIcon />, title: 'Course records', sub: 'Who holds what, where' },
  { icon: <StarIcon />, title: 'Birdies & streaks', sub: 'Yearly tallies vs theirs' },
];

export const UnsyncedPitchCard: React.FC<Props> = ({
  headline,
  subCopy,
  eyebrow,
  perks = DEFAULT_PERKS,
}) => {
  return (
    <div style={{ padding: '6px 20px 0', fontFamily: FONT }}>
      <div
        style={{
          padding: '22px 22px 20px',
          borderRadius: 20,
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(247,147,30,0.18), transparent 70%), ${BG_1}`,
          border: `1px solid ${LINE}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, #F7931E, transparent)',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <h3
          style={{
            margin: '0 0 8px',
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 900,
            color: T100,
            letterSpacing: '-0.02em',
            lineHeight: 1.18,
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            margin: '0 auto',
            textAlign: 'center',
            maxWidth: 280,
            fontSize: 13.5,
            color: T60,
            lineHeight: 1.45,
          }}
        >
          {subCopy}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginTop: 18,
          }}
        >
          {perks.map((p, i) => (
            <PerkTile key={i} icon={p.icon} title={p.title} sub={p.sub} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PerkTile: React.FC<Perk> = ({ icon, title, sub }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${LINE}`,
      borderRadius: 12,
      padding: '12px 10px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'rgba(247,147,30,0.12)',
        color: AMBER,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 8px',
      }}
    >
      {icon}
    </div>
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: T100,
        letterSpacing: '-0.005em',
        lineHeight: 1.25,
        marginBottom: 2,
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: 10.5, color: T60, lineHeight: 1.3 }}>{sub}</div>
  </div>
);

function ArrowsExchangeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21V9l-4 4M16 3v12l4-4" />
    </svg>
  );
}
function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18l5-6 4 3 7-9" />
      <path d="M14 6h6v6" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 14l-1 7 4-3 4 3-1-7" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2 5 5 .5-4 3.5 1.5 5L12 14l-4.5 3 1.5-5-4-3.5 5-.5z" />
    </svg>
  );
}
