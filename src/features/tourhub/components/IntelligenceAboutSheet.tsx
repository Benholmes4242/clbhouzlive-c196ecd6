/**
 * IntelligenceAboutSheet — first-tap explainer for clbhouz Intelligence.
 *
 * Triggered from the IntelligenceHero masthead (brain icon OR "i" icon).
 * Light-theme bottom sheet mirroring the historical picks sheet pattern.
 *
 * Sections (per v2 polish brief):
 *   1. Header (drag handle + close)
 *   2. Lead paragraph card (vague on multi-LLM consensus per locked decision)
 *   3. WHAT WE ANALYSE (6 icon rows)
 *   4. HOW PICKS ARE TIERED (3 tier rows)
 *   5. THE RECEIPTS (live track-record numbers from usePickHistory)
 *   6. Footnote
 */

import { memo } from 'react';
import {
  X,
  Brain,
  TrendingUp,
  Database,
  Award,
  Cpu,
  Newspaper,
  Cloud,
  Trophy,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface IntelligenceAboutSheetProps {
  open: boolean;
  onClose: () => void;
  trackRecord: { wins: number; topFives: number };
}

const GREEN_DEEP = '#0A5A3C';
const GREEN_ACCENT = '#2DBB78';
const AMBER = '#F7931E';
const SLATE_900 = '#0F172A';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const HAIRLINE = 'rgba(15, 23, 42, 0.08)';

interface AnalyseRow {
  icon: typeof TrendingUp;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
}

const ANALYSE_ROWS: AnalyseRow[] = [
  {
    icon: TrendingUp,
    iconColor: GREEN_ACCENT,
    iconBg: 'rgba(45, 187, 120, 0.12)',
    title: 'Player form',
    body: 'Last 12 starts weighted by recency, finish quality, and field strength.',
  },
  {
    icon: Database,
    iconColor: AMBER,
    iconBg: 'rgba(247, 147, 30, 0.10)',
    title: 'Course history',
    body: 'Past results at this venue and at courses with comparable profiles.',
  },
  {
    icon: Award,
    iconColor: GREEN_ACCENT,
    iconBg: 'rgba(45, 187, 120, 0.12)',
    title: 'Statistical fit',
    body: 'Strokes-gained categories matched to what the course actually rewards.',
  },
  {
    icon: Cpu,
    iconColor: AMBER,
    iconBg: 'rgba(247, 147, 30, 0.10)',
    title: 'World ranking trajectory',
    body: 'Ranking direction over the past 12 weeks, not just the snapshot.',
  },
  {
    icon: Newspaper,
    iconColor: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.10)',
    title: 'News and injuries',
    body: 'Late withdrawals, equipment changes, and reported injury status.',
  },
  {
    icon: Cloud,
    iconColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.10)',
    title: 'Weather projections',
    body: 'Wind and rain forecasts that historically reshape the leaderboard.',
  },
];

interface TierRow {
  label: string;
  tint: string;
  border: string;
  text: string;
  body: string;
}

const TIER_ROWS: TierRow[] = [
  {
    label: 'TOP PICK',
    tint: 'rgba(247, 147, 30, 0.12)',
    border: 'rgba(247, 147, 30, 0.35)',
    text: AMBER,
    body: 'Highest conviction. Strongest combined signal across form, fit, and venue history.',
  },
  {
    label: 'STRONG',
    tint: 'rgba(45, 187, 120, 0.12)',
    border: 'rgba(45, 187, 120, 0.30)',
    text: GREEN_ACCENT,
    body: 'Solid case across multiple signals. A realistic alternative to the Top Pick.',
  },
  {
    label: 'CONTENTION',
    tint: 'rgba(15, 23, 42, 0.06)',
    border: 'rgba(15, 23, 42, 0.10)',
    text: SLATE_500,
    body: 'In the conversation. Right profile for the venue with at least one strong signal.',
  },
];

export const IntelligenceAboutSheet = memo(function IntelligenceAboutSheet({
  open,
  onClose,
  trackRecord,
}: IntelligenceAboutSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      style={{ maxHeight: '85vh', backgroundColor: '#F8FAFC' }}
      ariaLabelledBy="intelligence-about-title"
    >
      <Header onClose={onClose} />
      <div
        style={{
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 60px)',
          padding: '4px 16px 24px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <LeadCard />
        <SectionLabel>What we analyse</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ANALYSE_ROWS.map((row) => (
            <AnalyseCard key={row.title} row={row} />
          ))}
        </div>
        <SectionLabel>How picks are tiered</SectionLabel>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: `1px solid ${HAIRLINE}`,
            overflow: 'hidden',
          }}
        >
          {TIER_ROWS.map((tier, i) => (
            <TierCard key={tier.label} tier={tier} isLast={i === TIER_ROWS.length - 1} />
          ))}
        </div>
        <ReceiptsCard wins={trackRecord.wins} topFives={trackRecord.topFives} />
        <Footnote />
      </div>
    </BottomSheet>
  );
});

// ─── Sub-components ─────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 16px',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: AMBER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(247,147,30,0.35)',
            flexShrink: 0,
          }}
        >
          <Brain size={18} color={GREEN_DEEP} strokeWidth={2.8} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            id="intelligence-about-title"
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: SLATE_900,
              letterSpacing: '-0.3px',
              lineHeight: 1.15,
            }}
          >
            About clbhouz Intelligence
          </h2>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: SLATE_600,
              letterSpacing: '-0.05px',
            }}
          >
            How we make our picks — and how to read them.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(15, 23, 42, 0.05)',
          color: SLATE_900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <X size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function LeadCard() {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: `1px solid ${HAIRLINE}`,
        padding: '16px 16px',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: SLATE_900,
          letterSpacing: '-0.1px',
        }}
      >
        clbhouz Intelligence analyses over 12,000 data points per tournament to
        identify the players most likely to win — and the players most likely
        to play well even if they don't.
      </p>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 13,
          lineHeight: 1.55,
          color: SLATE_600,
          letterSpacing: '-0.05px',
        }}
      >
        Picks come from our in-house artificial intelligence model,
        purpose-built to weight current form, course history, statistical
        fit, and live data signals into a single confidence-ranked shortlist
        for every PGA TOUR event.
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: '20px 0 10px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: GREEN_DEEP,
      }}
    >
      {children}
    </div>
  );
}

function AnalyseCard({ row }: { row: AnalyseRow }) {
  const Icon = row.icon;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: '#ffffff',
        borderRadius: 12,
        border: `1px solid ${HAIRLINE}`,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: row.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={row.iconColor} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: SLATE_900,
            letterSpacing: '-0.1px',
          }}
        >
          {row.title}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            lineHeight: 1.45,
            color: SLATE_600,
            letterSpacing: '-0.05px',
          }}
        >
          {row.body}
        </div>
      </div>
    </div>
  );
}

function TierCard({ tier, isLast }: { tier: TierRow; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          minWidth: 88,
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: tier.text,
          background: tier.tint,
          border: `1px solid ${tier.border}`,
          borderRadius: 999,
          padding: '5px 10px',
        }}
      >
        {tier.label}
      </span>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.5,
          color: SLATE_900,
          letterSpacing: '-0.05px',
          flex: 1,
        }}
      >
        {tier.body}
      </div>
    </div>
  );
}

function ReceiptsCard({ wins, topFives }: { wins: number; topFives: number }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 16px',
        borderRadius: 14,
        background: 'rgba(247, 147, 30, 0.08)',
        border: '1px solid rgba(247, 147, 30, 0.22)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(247, 147, 30, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Trophy size={15} color={AMBER} strokeWidth={2.4} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: AMBER,
          }}
        >
          The receipts
        </div>
      </div>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: SLATE_900,
          letterSpacing: '-0.05px',
        }}
      >
        This season Intelligence has called{' '}
        <strong style={{ color: AMBER, fontWeight: 800 }}>
          {wins} PGA TOUR {wins === 1 ? 'winner' : 'winners'}
        </strong>{' '}
        outright and landed{' '}
        <strong style={{ color: AMBER, fontWeight: 800 }}>
          {topFives} of our Top Picks
        </strong>{' '}
        inside the top 5.
      </p>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 12,
          lineHeight: 1.5,
          color: SLATE_600,
          letterSpacing: '-0.05px',
        }}
      >
        We show the misses too. If our Top Pick doesn't win, you'll see it on
        the card honestly — no fake "we called it" recaps.
      </p>
    </div>
  );
}

function Footnote() {
  return (
    <p
      style={{
        margin: '20px 0 0',
        fontSize: 11,
        lineHeight: 1.5,
        color: SLATE_400,
        letterSpacing: '-0.02px',
        textAlign: 'center',
      }}
    >
      Intelligence is for entertainment and editorial purposes. Not betting advice.
    </p>
  );
}
