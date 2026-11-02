/**
 * PlayerCell — headshot (34×34, radius 11, initials underneath), the flag on
 * its bottom-right corner (the WorldRankings wrapper), and the name with an
 * amber ★ for followed players. Shared by the front page and the full field.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { AMBER } from '../_shared/tokens';
import { initials } from './playersRules';
import { P } from './playersTokens';

export function useHeadshot(rawName: string, name: string, tourCode: string | null) {
  const candidates = useMemo(() => {
    const tc = tourCode || 'pga';
    const all = [...getPlayerHeadshotCandidates(rawName, tc), ...(name !== rawName ? getPlayerHeadshotCandidates(name, tc) : [])];
    return all.filter((u, i) => all.indexOf(u) === i);
  }, [rawName, name, tourCode]);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [candidates]);
  const src = i < candidates.length ? candidates[i] : null;
  return { src, onError: () => setI((n) => n + 1) };
}

export function Headshot({ rawName, name, tourCode, size = 34, radius = 11 }: { rawName: string; name: string; tourCode: string | null; size?: number; radius?: number }) {
  const { src, onError } = useHeadshot(rawName, name, tourCode);
  return (
    <span data-headshot style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', background: P.PHOTO, display: 'grid', placeItems: 'center', position: 'relative', flex: 'none', fontSize: size >= 30 ? 11 : 8, fontWeight: 800, color: P.MUTE }}>
      {initials(name)}
      {src ? <img src={src} alt="" aria-hidden="true" loading="lazy" onError={onError} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%' }} /> : null}
    </span>
  );
}

export function PlayerCell({ rawName, name, tourCode, country, followed, nameSize = 15, sub, bar }: {
  rawName: string; name: string; tourCode: string | null; country: string | null; followed: boolean;
  nameSize?: number; sub?: ReactNode; bar?: ReactNode;
}) {
  return (
    <span data-player-cell style={{ position: 'relative', paddingLeft: 44, minHeight: 34, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34 }}>
        <Headshot rawName={rawName} name={name} tourCode={tourCode} />
        {country ? (
          <span data-flag style={{ position: 'absolute', right: -5, bottom: -4, width: 16, height: 12, borderRadius: 2, overflow: 'hidden', display: 'block', lineHeight: 0 }}>
            <CountryFlag country={country} size="sm" className="border-none" />
          </span>
        ) : null}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, fontSize: nameSize, fontWeight: 600, color: P.INK }}>
        <span data-player-name style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {followed ? <span data-followed-star style={{ flex: 'none', color: AMBER, fontSize: 11 }}>★</span> : null}
      </span>
      {sub ? <span data-player-sub style={{ display: 'block', marginTop: 3, fontSize: 12, color: P.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span> : null}
      {bar}
    </span>
  );
}

export function PointsBar({ pct, lead }: { pct: number; lead: boolean }) {
  return (
    <span data-points-bar style={{ display: 'block', marginTop: 7, height: 3, borderRadius: 2, background: P.HAIR, overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 2, background: lead ? P.INK : 'rgba(248,250,252,0.5)' }} />
    </span>
  );
}

export function Move({ moved, size = 12 }: { moved: number | null; size?: number }) {
  const tone = moved == null || moved === 0 ? 'none' : moved > 0 ? 'up' : 'down';
  const text = tone === 'none' ? '–' : tone === 'up' ? `▲${moved}` : `▼${Math.abs(moved as number)}`;
  return <span data-move={tone} style={{ textAlign: 'right', fontSize: size, fontWeight: 800, color: tone === 'up' ? P.GREEN : tone === 'down' ? P.DIM : P.FAINT }}>{text}</span>;
}
