/** The sponsor sheet — a fixed 360px-wide design rendered from data already
 * loaded on the profile plus get_pro_reach. The preview scales the card to
 * the sheet width (never above 1); the export captures an off-screen
 * full-size node at html2canvas scale 3 (1080px), the TopTenShareSheet
 * pipeline. Cover/avatar are fetched as CORS blobs so the canvas is never
 * tainted. A block with no data is left out, and its chip with it. Chip
 * choices persist per user in localStorage, wrapped in try/catch. */
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { toast } from '@/lib/toast';
import { useProEvents, useProWorldRank } from './useProProfile';
import { useProBag, useProCareer, useProPartners } from './useProCollections';
import { useProClubhouse, useProReach } from './useProClubhouse';
import { careerEntries, orderedBag, orderedPartners } from './proCollectionRules';
import { finishLabel, formatWorldRank, rankMovement, sortedEvents, type ProEvent, type WorldRank } from './proProfileRules';
import { bagLine, sponsorSourceLine, type ProReach } from './proClubhouseRules';

export interface SponsorIdentity {
  name: string;
  first: string;
  last: string;
  username: string;
  avatar: string | null;
  cover: string | null;
  tour: string | null;
  homeClub: string | null;
}
export interface SponsorSeason {
  year: number;
  events: number;
  cuts: number;
  top10s: number;
  best: string | null;
  scoring: string | null;
  results: ProEvent[];
}

type BlockKey = 'season' | 'results' | 'career' | 'reach' | 'partners' | 'bag';
const BLOCKS: { key: BlockKey; label: string }[] = [
  { key: 'season', label: 'Season' },
  { key: 'results', label: 'Results' },
  { key: 'career', label: 'Career' },
  { key: 'reach', label: 'On clbhouz' },
  { key: 'partners', label: 'Partners' },
  { key: 'bag', label: 'In the bag' },
];
const STORAGE_KEY = 'pro-sponsor-sheet-blocks';
const DEFAULT_BLOCKS: Record<BlockKey, boolean> = { season: true, results: true, career: true, reach: true, partners: true, bag: true };
const readBlocks = (): Record<BlockKey, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_BLOCKS, ...(JSON.parse(raw) as Partial<Record<BlockKey, boolean>>) };
  } catch { /* storage unavailable: defaults */ }
  return DEFAULT_BLOCKS;
};
const writeBlocks = (blocks: Record<BlockKey, boolean>) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks)); } catch { /* fine if unavailable */ }
};

const CARD_WIDTH = 360;
const EXPORT_SCALE = 3;

interface CardProps {
  identity: SponsorIdentity;
  season: SponsorSeason | null;
  rank: WorldRank | null;
  career: { id: string; year: number; text: string; is_win: boolean }[];
  partners: string[];
  bagText: string;
  reach: ProReach | null;
  followers: number | null;
  watchers: number;
  blocks: Record<BlockKey, boolean>;
  qrUrl: string | null;
  coverUrl: string | null;
  avatarUrl: string | null;
}

function ProSponsorCard({ identity, season, rank, career, partners, bagText, reach, followers, watchers, blocks, qrUrl, coverUrl, avatarUrl }: CardProps) {
  const movement = rankMovement(rank);
  const results = (season?.results ?? []).slice(0, 4);
  const moments = career.slice(0, 4);
  const profileUrl = `clbhouz.co.uk/profile/${identity.username}`;
  return (
    <div className="pro-ss" data-sponsor-card style={{ width: CARD_WIDTH }}>
      <div
        className="pro-ss-top"
        style={coverUrl
          ? { backgroundImage: `linear-gradient(180deg, rgba(10,10,12,0.35), rgba(10,10,12,0.92)), url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined}
      >
        <div className="pro-ss-id">
          <SquircleAvatar size={52} hairlineRing src={avatarUrl} alt={identity.name} userId={identity.username} />
          <div className="pro-ss-id-text">
            <div className="pro-ss-nm">{identity.name}<ProLabel size="small" /></div>
            {identity.tour && <div className="pro-ss-sub">Tour professional · {identity.tour}</div>}
            {identity.homeClub && <div className="pro-ss-sub pro-ss-sub-mute">{identity.homeClub}</div>}
          </div>
        </div>
        {rank ? (
          <div className="pro-ss-rank">
            <b>#{formatWorldRank(rank.rank)}</b>
            <div>
              <span className="pro-ss-lab">WORLD RANKING</span>
              {movement && (
                <em>{movement.improved
                  ? <><span className="pro-ss-up">▲ {movement.difference.toLocaleString('en-GB')}</span> {movement.period}</>
                  : <span className="pro-ss-mute">▼ {movement.difference.toLocaleString('en-GB')} {movement.period}</span>}</em>
              )}
              {rank.best_rank != null && <em className="pro-ss-mute">Career best #{formatWorldRank(rank.best_rank)}</em>}
            </div>
          </div>
        ) : season?.best ? (
          <div className="pro-ss-rank">
            <b>{finishLabel(season.best)}</b>
            <div><span className="pro-ss-lab">BEST FINISH {season.year}</span></div>
          </div>
        ) : null}
      </div>
      <div className="pro-ss-body">
        {blocks.season && season && (
          <>
            <div className="pro-ss-h">{season.year} SEASON</div>
            <div className="pro-ss-stats">
              <div><b>{season.events}</b><span>EVENTS</span></div>
              <div><b>{season.cuts}</b><span>CUTS</span></div>
              <div><b>{season.top10s}</b><span>TOP 10S</span></div>
              <div><b className={finishLabel(season.best) === '1st' ? 'pro-ss-gold' : undefined}>{finishLabel(season.best)}</b><span>BEST</span></div>
              <div><b>{season.scoring ?? '—'}</b><span>SCORING</span></div>
            </div>
          </>
        )}
        {(blocks.results && results.length > 0) || (blocks.career && moments.length > 0) ? (
          <div className="pro-ss-two">
            {blocks.results && results.length > 0 && (
              <div className="pro-ss-res">
                <div className="pro-ss-h">LATEST RESULTS</div>
                {results.map((e) => {
                  const label = finishLabel(e.finish);
                  const eliminated = ['MC', 'WD', 'DQ'].includes(e.finish?.toUpperCase() ?? '');
                  return <div key={e.id}><b className={eliminated ? 'pro-ss-mc' : undefined}>{label}</b><span>{e.event_name}</span></div>;
                })}
              </div>
            )}
            {blocks.career && moments.length > 0 && (
              <div className="pro-ss-car">
                <div className="pro-ss-h">CAREER</div>
                {moments.map((m) => <div key={m.id} className={m.is_win ? 'pro-ss-win' : undefined}>{m.text}<small>{m.year}</small></div>)}
              </div>
            )}
          </div>
        ) : null}
        {blocks.reach && reach && (
          <div className="pro-ss-line">
            <div className="pro-ss-h">ON CLBHOUZ</div>
            <div className="pro-ss-reach">
              <div><b>{reach.views_30.toLocaleString('en-GB')}</b><span>PROFILE VIEWS, 30 DAYS</span></div>
              <div><b>{(followers ?? 0).toLocaleString('en-GB')}</b><span>FOLLOWERS</span></div>
              <div><b>{watchers.toLocaleString('en-GB')}</b><span>GET HIS SCORES EACH DAY</span></div>
            </div>
          </div>
        )}
        {blocks.partners && partners.length > 0 && (
          <div className="pro-ss-line"><div className="pro-ss-h">PARTNERS</div><p>{partners.join(' · ')}</p></div>
        )}
        {blocks.bag && bagText && (
          <div className="pro-ss-line"><div className="pro-ss-h">IN THE BAG</div><p>{bagText}</p></div>
        )}
        <div className="pro-ss-foot">
          {qrUrl && <span className="pro-ss-qr"><img src={qrUrl} width={64} height={64} alt="" /></span>}
          <div className="pro-ss-foot-text">
            <b>See {identity.first}'s live profile</b>
            <span>{profileUrl}</span>
            <span style={{ marginTop: 4 }}>Message him on clbhouz.</span>
          </div>
        </div>
        <div className="pro-ss-src"><span>{sponsorSourceLine(rank)}</span><b>clbhouz</b></div>
      </div>
    </div>
  );
}

export function ProSponsorSheet({ open, onClose, proId, identity, season, followers }: {
  open: boolean;
  onClose: () => void;
  proId: string;
  identity: SponsorIdentity;
  season: SponsorSeason | null;
  followers: number | null;
}) {
  const reachQuery = useProReach(open);
  const clubhouseQuery = useProClubhouse(proId);
  const eventsQuery = useProEvents(proId);
  const rankQuery = useProWorldRank(proId);
  const bagQuery = useProBag(proId);
  const partnersQuery = useProPartners(proId);
  const careerQuery = useProCareer(proId);

  const [blocks, setBlocks] = useState<Record<BlockKey, boolean>>(readBlocks);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<{ cover: string | null; avatar: string | null }>({ cover: null, avatar: null });
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(0);
  const fitRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const rank = rankQuery.isSuccess && !rankQuery.isError ? rankQuery.data : null;
  const reach = reachQuery.isSuccess && !reachQuery.isError ? reachQuery.data : null;
  const clubhouse = clubhouseQuery.isSuccess && !clubhouseQuery.isError ? clubhouseQuery.data : null;
  const bag = bagQuery.isSuccess && !bagQuery.isError ? orderedBag(bagQuery.data ?? []) : [];
  const partners = partnersQuery.isSuccess && !partnersQuery.isError ? orderedPartners(partnersQuery.data ?? []) : [];
  const events = eventsQuery.isSuccess && !eventsQuery.isError ? eventsQuery.data ?? [] : [];
  const career = careerQuery.isSuccess && !careerQuery.isError && eventsQuery.isSuccess && !eventsQuery.isError
    ? careerEntries(events, careerQuery.data ?? [])
    : [];

  const available: Record<BlockKey, boolean> = {
    season: !!season && season.events > 0,
    results: !!season && season.results.length > 0,
    career: career.length > 0,
    reach: reach != null,
    partners: partners.length > 0,
    bag: bag.length > 0,
  };

  const profileUrl = `https://clbhouz.co.uk/profile/${identity.username}`;

  useEffect(() => {
    if (!open || !identity.username) return;
    let cancelled = false;
    QRCode.toDataURL(profileUrl, { margin: 2, width: 512, color: { dark: '#0A0A0C', light: '#FFFFFF' } })
      .then((url) => { if (!cancelled) setQrUrl(url); })
      .catch(() => { if (!cancelled) setQrUrl(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, identity.username]);

  // CORS blob URLs for the capture, the TopTenShareSheet pattern: a failed
  // fetch leaves a null slot and the card draws its plain panel.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const made: string[] = [];
    (async () => {
      const next: { cover: string | null; avatar: string | null } = { cover: null, avatar: null };
      await Promise.all((['cover', 'avatar'] as const).map(async (key) => {
        const src = key === 'cover' ? identity.cover : identity.avatar;
        if (!src) return;
        try {
          const res = await fetch(src, { mode: 'cors' });
          if (!res.ok) throw new Error(String(res.status));
          const url = URL.createObjectURL(await res.blob());
          made.push(url);
          next[key] = url;
        } catch { /* null slot: plain panel */ }
      }));
      if (cancelled) made.forEach((u) => URL.revokeObjectURL(u));
      else setMedia(next);
    })();
    return () => { cancelled = true; made.forEach((u) => URL.revokeObjectURL(u)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, identity.cover, identity.avatar]);

  // Preview scaling: the 360px card scales to the container width, never
  // above 1. Observer writes are deferred to rAF so they never loop.
  useEffect(() => {
    if (!open) return;
    const fit = fitRef.current;
    if (!fit) return;
    let raf = 0;
    const measure = () => {
      raf = requestAnimationFrame(() => {
        setScale(Math.min(1, fit.clientWidth / CARD_WIDTH));
        const card = previewCardRef.current;
        if (card) setCardHeight(card.offsetHeight);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fit);
    if (previewCardRef.current) ro.observe(previewCardRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [open, blocks, qrUrl, media]);

  const toggle = (key: BlockKey) => {
    setBlocks((current) => {
      const next = { ...current, [key]: !current[key] };
      writeBlocks(next);
      return next;
    });
  };

  const cardProps: CardProps = useMemo(() => ({
    identity,
    season,
    rank,
    career,
    partners: partners.map((p) => p.name),
    bagText: bagLine(bag),
    reach,
    followers,
    watchers: clubhouse?.watchers ?? 0,
    blocks,
    qrUrl,
    coverUrl: media.cover,
    avatarUrl: media.avatar,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [identity, season, rank, career, partners, bag, reach, followers, clubhouse, blocks, qrUrl, media]);

  const capture = async (): Promise<Blob> => {
    const el = captureRef.current;
    if (!el) throw new Error('nothing to capture');
    const canvas = await html2canvas(el, { backgroundColor: '#0A0A0C', scale: EXPORT_SCALE, useCORS: true, logging: false });
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('capture failed');
    return blob;
  };

  const filename = `${identity.first}-${identity.last}-sponsor-sheet.png`.toLowerCase().replace(/\s+/g, '-');
  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try { download(await capture()); }
    catch { toast.error("Couldn't create your sponsor sheet"); }
    finally { setBusy(false); }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await capture();
      const file = new File([blob], filename, { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${identity.name}, tour professional. ${profileUrl.replace('https://', '')}` });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      download(blob);
    } catch {
      toast.error("Couldn't create your sponsor sheet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} scrollBody ariaLabelledBy="pro-sponsor-title">
      <div className="pro-profile-sheet pro-sponsor-sheet">
        <div className="pro-collection-kicker">SPONSOR SHEET</div>
        <h2 id="pro-sponsor-title">Your sponsor sheet</h2>
        <div className="pro-collection-field">
          <label>WHAT GOES ON IT</label>
          <div className="pro-collection-chips">
            {BLOCKS.filter((b) => available[b.key]).map((b) => (
              <button key={b.key} type="button" role="checkbox" aria-checked={blocks[b.key]} onClick={() => toggle(b.key)}>{b.label}</button>
            ))}
          </div>
        </div>
        <div className="pro-ss-fit" ref={fitRef} style={{ height: cardHeight ? cardHeight * scale : undefined }}>
          <div ref={previewCardRef} style={{ width: CARD_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ProSponsorCard {...cardProps} />
          </div>
        </div>
        <div className="pro-sponsor-actions">
          <Button variant={null} size={null} className="pro-sponsor-save" onClick={handleSave} disabled={busy}>{busy ? 'Working…' : 'Save image'}</Button>
          <Button variant={null} size={null} className="pro-sponsor-share" onClick={handleShare} disabled={busy}>{busy ? 'Working…' : 'Share'}</Button>
        </div>
        <p className="pro-sponsor-note">Every figure is as of today. Make a new one whenever you want it up to date.</p>
      </div>
      {/* Off-screen full-size card; capture never uses the scaled preview. */}
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <div ref={captureRef}>
          <ProSponsorCard {...cardProps} />
        </div>
      </div>
    </BottomSheet>
  );
}
