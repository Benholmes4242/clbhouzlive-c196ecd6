/**
 * HandicapVisibilityControl — handicap page audience control in Edit Profile.
 *
 *   Block: "Handicap Page & Comparisons" → handicap_page_visibility
 *
 * Course Champions appearance is no longer controlled here; it now follows the
 * unified `leaderboard_visibility` setting in Settings → Privacy (which also
 * governs all ranked surfaces). See Brief 3.
 */
import { Globe2, Users, EyeOff, Check } from 'lucide-react';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';

export type HandicapVisibility = 'everyone' | 'friends' | 'nobody';

interface Props {
  handicapPageVisibility: HandicapVisibility;
  onHandicapPageChange: (v: HandicapVisibility) => void;
}

const INK = '#0F172A';
const INK_55 = '#64748B';
const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const OPTIONS: ReadonlyArray<{
  value: HandicapVisibility;
  label: string;
  sub: string;
  Icon: typeof Globe2;
}> = [
  { value: 'everyone', label: 'Everyone',     sub: 'Anyone on clbhouz',  Icon: Globe2 },
  { value: 'friends',  label: 'Friends only', sub: 'Only your friends',  Icon: Users  },
  { value: 'nobody',   label: 'Hidden',       sub: 'Nobody but you',     Icon: EyeOff },
];

function Block({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: HandicapVisibility;
  onChange: (v: HandicapVisibility) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontFamily: GEIST, fontSize: 13, fontWeight: 700, color: INK,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </span>
      </div>
      <p
        style={{
          fontFamily: GEIST, fontSize: 12, color: INK_55, marginBottom: 10, lineHeight: 1.4,
        }}
      >
        {description}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="relative flex flex-col items-start text-left rounded-[11px] px-3 py-3 min-h-[80px] transition-colors"
              style={{
                background: selected ? 'rgba(15,23,42,0.04)' : '#F8FAFC',
                border: selected ? `1.5px solid ${INK}` : '1px solid rgba(15,23,42,0.10)',
              }}
              aria-pressed={selected}
            >
              <div className="flex items-center justify-between w-full" style={{ marginBottom: 6 }}>
                <opt.Icon size={14} strokeWidth={2.25} style={{ color: selected ? INK : INK_55 }} />
                {selected && <Check size={13} strokeWidth={2.75} style={{ color: INK }} />}
              </div>
              <span
                style={{
                  fontFamily: GEIST, fontSize: 12, fontWeight: 700, color: INK,
                  lineHeight: 1.1,
                }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  fontFamily: GEIST, fontSize: 10, color: INK_55, marginTop: 2,
                  lineHeight: 1.25,
                }}
              >
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HandicapVisibilityControl({
  handicapPageVisibility,
  onHandicapPageChange,
}: Props) {
  return (
    <div className="space-y-5">
      <div style={{ marginBottom: 4 }}>
        <SectionEyebrow label="Handicap Visibility" />
      </div>

      <Block
        title="Handicap Page & Comparisons"
        description="Show your handicap stats and peer comparisons to others on the handicap page."
        value={handicapPageVisibility}
        onChange={onHandicapPageChange}
      />

      <p
        style={{
          fontFamily: GEIST, fontSize: 11, color: INK_55, lineHeight: 1.45,
          marginTop: 4,
        }}
      >
        Your appearance in Course Champions and other ranked boards is controlled by
        “Who can see you in leaderboards” in Settings → Privacy. Your own data is always visible to you.
      </p>
    </div>
  );
}

export default HandicapVisibilityControl;
