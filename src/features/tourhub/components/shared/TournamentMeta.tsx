/**
 * TournamentMeta — Phase 2 Tier 4 dashed-divider section.
 *
 * Renders below the location line on Upcoming rows for events worth
 * elevating (majors, signature events, big-purse). Surfaces:
 *   - Defending champion (16px squircle photo + "Defending: {name}")
 *   - Field strength tier (TrendingUp icon + "Field: Stacked/Strong/Solid")
 *
 * Returns null when neither prop is provided. Vertical divider only
 * appears when both items render.
 *
 * Per Schedule Polish Phase 2 brief.
 */
import { TrendingUp } from 'lucide-react';

interface TournamentMetaProps {
  defendingChampion?: { name: string; photoUrl?: string | null } | null;
  fieldStrengthLabel?: 'Stacked' | 'Strong' | 'Solid' | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function TournamentMeta({ defendingChampion, fieldStrengthLabel }: TournamentMetaProps) {
  const hasDefending = !!defendingChampion?.name;
  const hasField = !!fieldStrengthLabel;
  if (!hasDefending && !hasField) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
        marginTop: 8,
        borderTop: '1px dashed rgba(15,23,42,0.12)',
      }}
    >
      {hasDefending && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '34%',
              overflow: 'hidden',
              background: 'rgba(15,23,42,0.06)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {defendingChampion?.photoUrl ? (
              <img
                src={defendingChampion.photoUrl}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            ) : (
              <span style={{ fontSize: 7, fontWeight: 900, color: '#64748B', letterSpacing: 0.2 }}>
                {getInitials(defendingChampion!.name)}
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: '#64748B' }}>Defending: </span>
            <span style={{ color: '#334155' }}>{defendingChampion!.name}</span>
          </span>
        </div>
      )}

      {hasDefending && hasField && (
        <span style={{ width: 1, height: 10, background: 'rgba(15,23,42,0.18)', flexShrink: 0 }} />
      )}

      {hasField && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <TrendingUp size={11} strokeWidth={2.5} style={{ color: '#F7931E' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#334155', letterSpacing: 0.1 }}>
            Field: {fieldStrengthLabel}
          </span>
        </div>
      )}
    </div>
  );
}
