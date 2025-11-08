/**
 * Game Expanded Roster
 * Shows host and members with avatars
 */

type RosterPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
  homeClub?: string | null;
  handicap?: number | null;
};

type GameExpandedRosterProps = {
  host: RosterPerson;
  members: RosterPerson[];
};

export function GameExpandedRoster({ host, members }: GameExpandedRosterProps) {
  const nonHostMembers = members.filter(m => m.id !== host.id);
  
  return (
    <div className="mt-3 grid grid-cols-2 gap-6">
      {/* Host */}
      <div>
        <div className="text-[12px] mb-1.5" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
          Host
        </div>
        <div className="flex items-center gap-2">
          {host.avatarUrl ? (
            <img 
              className="h-7 w-7 rounded-full" 
              src={host.avatarUrl} 
              alt=""
            />
          ) : (
            <div 
              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-medium"
              style={{ 
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--hub-text-body)',
              }}
            >
              {host.name === 'Guest' ? 'G' : host.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[14px] truncate" style={{ color: 'var(--hub-text-body)' }}>
              {host.name}
            </div>
            {host.homeClub && (
              <div className="text-[13px] truncate" style={{ color: 'var(--hub-text-body)', opacity: 0.9 }}>
                {host.homeClub}
              </div>
            )}
            {host.handicap != null && (
              <div className="text-[12px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.65 }}>
                HCP {host.handicap.toFixed(1)}
              </div>
            )}
            {!host.homeClub && host.handicap == null && (
              <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}>
                —
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="text-[12px] mb-1.5" style={{ color: 'var(--hub-text-body)', opacity: 0.7 }}>
          Members
        </div>
        <div className="flex flex-col gap-1">
          {nonHostMembers.length === 0 ? (
            <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}>
              No members yet
            </div>
          ) : (
            <>
              {nonHostMembers.slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center gap-2 mb-2 last:mb-0">
                  {m.avatarUrl ? (
                    <img 
                      className="h-6 w-6 rounded-full" 
                      src={m.avatarUrl} 
                      alt=""
                    />
                  ) : (
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                      style={{ 
                        background: 'rgba(255,255,255,0.1)',
                        color: 'var(--hub-text-body)',
                      }}
                    >
                      {m.name === 'Guest' ? 'G' : m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ color: 'var(--hub-text-body)' }}>
                      {m.name}
                    </div>
                    {m.homeClub && (
                      <div className="text-[13px] truncate" style={{ color: 'var(--hub-text-body)', opacity: 0.9 }}>
                        {m.homeClub}
                      </div>
                    )}
                    {m.handicap != null && (
                      <div className="text-[12px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.65 }}>
                        HCP {m.handicap.toFixed(1)}
                      </div>
                    )}
                    {!m.homeClub && m.handicap == null && (
                      <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}>
                        —
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {nonHostMembers.length > 3 && (
                <div className="text-[12px]" style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}>
                  +{nonHostMembers.length - 3} more
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
