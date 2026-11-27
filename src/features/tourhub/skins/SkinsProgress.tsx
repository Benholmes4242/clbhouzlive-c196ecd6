/** Brief 47: the skins hero progress bar (replaces the R1–R4 strip). Dependency-light for PhotoBand. */
import './skins.css';

/** Hero progress (replaces the R1–R4 strip). */
export function SkinsProgress({ fraction, left, right }: { fraction: number; left: string; right: string }) {
  return <>
    <div className="skins-prog" data-skins-progress><span style={{ width: `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%` }} /></div>
    <div className="skins-progl"><span>{left}</span><span>{right}</span></div>
  </>;
}

