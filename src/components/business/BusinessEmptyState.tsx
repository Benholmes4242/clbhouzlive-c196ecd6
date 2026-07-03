import { ArrowRight, Building2, Search, Star, TrendingUp, type LucideIcon } from 'lucide-react';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#c97a10';

interface BusinessEmptyStateProps {
  onCreate: () => void;
}

interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Search,
    title: 'Be discoverable',
    body: 'Show up in search and the business directory where golfers are already looking.',
  },
  {
    icon: Star,
    title: 'Build trust',
    body: 'Collect reviews and show real social proof from the community.',
  },
  {
    icon: TrendingUp,
    title: 'Understand your reach',
    body: 'See how many golfers view, follow and engage with your profile.',
  },
];

export function BusinessEmptyState({ onCreate }: BusinessEmptyStateProps) {
  return (
    <div
      className="w-full max-w-md mx-auto flex flex-col items-center"
      style={{
        fontFamily: 'Geist, system-ui, sans-serif',
        paddingTop: 32,
        paddingBottom: 48,
        paddingLeft: 20,
        paddingRight: 20,
        gap: 28,
      }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center" style={{ gap: 14 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: AMBER_SOFT,
          }}
        >
          <Building2 size={30} color={AMBER_DEEP} strokeWidth={2} />
        </div>
        <h1
          className="text-center"
          style={{
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: INK,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Put your business on clbhouz
        </h1>
        <p
          className="text-center"
          style={{
            fontSize: 14.5,
            lineHeight: 1.45,
            color: INK_45,
            maxWidth: 300,
            margin: 0,
          }}
        >
          Create a profile for your golf club, academy or brand and reach golfers where they already are.
        </p>
      </div>

      {/* Benefit cards */}
      <div className="w-full flex flex-col" style={{ gap: 10 }}>
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-start"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${HAIR}`,
              borderRadius: 14,
              padding: '14px 15px',
              gap: 12,
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: AMBER_SOFT,
              }}
            >
              <Icon size={19} color={AMBER_DEEP} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0" style={{ paddingTop: 1 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  color: INK,
                  lineHeight: 1.25,
                  marginBottom: 2,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: INK_45,
                }}
              >
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full flex flex-col items-center" style={{ gap: 10 }}>
        <button
          type="button"
          onClick={onCreate}
          className="w-full flex items-center justify-center active:opacity-90 transition-opacity"
          style={{
            minHeight: 54,
            borderRadius: 14,
            background: AMBER,
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            gap: 8,
            boxShadow: '0 6px 18px -6px rgba(247,147,30,0.45)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Create business profile
          <ArrowRight size={18} strokeWidth={2.25} />
        </button>
        <p
          className="text-center"
          style={{
            fontSize: 12.5,
            color: INK_45,
            margin: 0,
          }}
        >
          Free to set up. Takes about a minute.
        </p>
      </div>
    </div>
  );
}

export default BusinessEmptyState;
