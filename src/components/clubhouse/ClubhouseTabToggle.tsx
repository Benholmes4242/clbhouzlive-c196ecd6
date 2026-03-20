import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
  isBusinessActor?: boolean;
}

/**
 * ClubhouseTabToggle — Pinpoint dark-surface main tab (white text, amber gradient underline)
 */
export const ClubhouseTabToggle = ({
  activeTab,
  onTabChange,
  className,
  isBusinessActor = false,
}: ClubhouseTabToggleProps) => {
  if (isBusinessActor) {
    return (
      <div className={cn("flex items-center gap-3 relative z-[45]", className)} role="tablist" aria-label="Feed filter">
        <span className="text-sm font-semibold text-white opacity-100 whitespace-nowrap py-3 px-1">
          Suggested
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-4 sm:gap-7 relative z-[45]", className)}
      role="tablist"
      aria-label="Feed filter"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {(['foryou', 'friends'] as const).map((id) => {
        const label = id === 'foryou' ? 'Suggested' : 'Friends';
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(id)}
            className="min-w-0"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 4px 8px',
              fontSize: 'clamp(14px, 4vw, 17px)',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
              letterSpacing: isActive ? '-0.025em' : '0',
              position: 'relative' as const,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.18s',
            }}
          >
            {label}
            {/* divider line — only on active tab, same width as orange indicator */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(255,255,255,0.08)',
            }} />
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2.5,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
};
