import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';

interface ExplorerProfileCardProps {
  displayName: string;
  avatarUrl: string | null;
  homeClub: string | null;
  userId: string;
  coursesCount: number;
  countriesCount: number;
  continentsCount: number;
  countryList: string[];
  globalRank: number | null;
  seasonColor?: string;
}

const getRankSuffix = (rank: number): string => {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const MAX_FLAGS = 8;

export function ExplorerProfileCard({
  displayName,
  avatarUrl,
  homeClub,
  coursesCount,
  countriesCount,
  continentsCount,
  countryList,
  globalRank,
}: ExplorerProfileCardProps) {
  const flagsToShow = countryList.slice(0, MAX_FLAGS);
  const remaining = countryList.length - MAX_FLAGS;

  return (
    <div>
      <div>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                border: '2.5px solid hsl(var(--accent-amber) / 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SquircleAvatar
                size={46}
                src={avatarUrl || undefined}
                alt={displayName}
                fallback={displayName.charAt(0)}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: 10 }}>
              Your Explorer Profile
            </p>
            <p className="text-foreground truncate" style={{ fontSize: 17, fontWeight: 800 }}>
              {displayName}
            </p>
            {homeClub && (
              <p className="text-muted-foreground truncate" style={{ fontSize: 12 }}>
                {homeClub}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-muted-foreground uppercase" style={{ fontSize: 9, opacity: 0.6 }}>
              Global Rank
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'hsl(var(--accent-amber))' }}>
              {globalRank ? `${globalRank}${getRankSuffix(globalRank)}` : '—'}
            </p>
          </div>
        </div>

        {/* Stats chips */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { icon: '⛳', value: coursesCount, label: 'COURSES' },
            { icon: '🌍', value: countriesCount, label: 'COUNTRIES' },
            { icon: '🗺️', value: continentsCount, label: 'CONTINENTS' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: 12,
                padding: '8px 4px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ fontSize: 13 }}>{stat.icon}</span>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--accent-amber))' }}>
                {stat.value}
              </p>
              <p className="text-muted-foreground uppercase" style={{ fontSize: 9, fontWeight: 600 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Passport flags */}
        {countryList.length > 0 && (
          <div className="mt-3">
            <p className="text-muted-foreground uppercase" style={{ fontSize: 10, opacity: 0.6, marginBottom: 6 }}>
              Countries Played
            </p>
            <div className="flex flex-wrap gap-1.5">
              {flagsToShow.map((country) => (
                <div
                  key={country}
                  className="flex items-center justify-center"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <CountryFlag country={country} size="sm" />
                </div>
              ))}
              {remaining > 0 && (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: '1.5px dashed hsl(var(--accent-amber) / 0.3)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'hsl(var(--accent-amber))',
                  }}
                >
                  +{remaining}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
