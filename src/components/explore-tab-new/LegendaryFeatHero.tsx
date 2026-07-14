import { useEffect, useMemo, useRef, useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const HERO_H = 168;

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function relDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - that) / 86400000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days}D AGO`;
  if (days < 30) return `${Math.floor(days / 7)}W AGO`;
  if (days < 365) return `${Math.floor(days / 30)}MO AGO`;
  return `${Math.floor(days / 365)}Y AGO`;
}

function labelFor(featType?: string): string {
  if (featType === 'albatross') return 'ALBATROSS';
  if (featType === 'ace') return 'HOLE-IN-ONE';
  return 'LEGENDARY';
}

interface Props {
  region: string | null;
  onRowTap?: (row: FeatRow) => void;
}

interface CardProps {
  row: FeatRow;
  isSolo: boolean;
  showPager: boolean;
  indexLabel: string;
  onTap: () => void;
}

function HeroCard({ row, isSolo, showPager, indexLabel, onTap }: CardProps) {
  const image = row.course_image ?? row.thumbnail_image ?? null;
  const holder = formatHolderName(row.holder_name);
  const when = relDate(row.play_date ?? row.attained_at ?? null);
  const chip = labelFor(row.feat_type);
  const value = (row.feat_value ?? '').toUpperCase();

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.995] transition-transform"
      style={{
        flex: '0 0 auto',
        width: isSolo ? '100%' : '90%',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        position: 'relative',
        height: HERO_H,
        borderRadius: 18,
        overflow: 'hidden',
        padding: 0,
        border: 'none',
        background: image ? '#07080C' : '#0A0C10',
        cursor: 'pointer',
        fontFamily: FONT,
        boxShadow: `0 0 0 1px ${GOLD}66, 0 6px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(155deg, rgba(10,12,16,0.72), rgba(10,12,16,0.90))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 85% 20%, #FBBC2E26, transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 18,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: GOLD,
          lineHeight: 1,
        }}
      >
        {chip}
        {when ? ` \u00B7 ${when}` : ''}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 52,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {value ? (
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: '#ffffff',
              fontVariantNumeric: 'tabular-nums',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 18,
          bottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SquircleAvatar
          size={20}
          src={row.holder_avatar}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
          ringColor={GOLD}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1,
            fontFamily: FONT,
          }}
        >
          {holder}
        </span>
      </div>

      {showPager ? (
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 16,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: GOLD,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {indexLabel} \u203A
        </div>
      ) : null}
    </button>
  );
}

export function LegendaryFeatHero({ region, onRowTap }: Props) {
  const { data, isLoading } = useRegionFeats(region, 'legendary');
  const rows = data ?? [];
  const total = rows.length;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (total <= 1) return;
    const root = trackRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        for (const e of entries) {
          const idxAttr = (e.target as HTMLElement).dataset.idx;
          if (idxAttr == null) continue;
          const idx = Number(idxAttr);
          if (!best || e.intersectionRatio > best.ratio) {
            best = { idx, ratio: e.intersectionRatio };
          }
        }
        if (best && best.ratio > 0.6) setActiveIndex(best.idx);
      },
      { root, threshold: [0.5, 0.75, 0.95] },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [total]);

  const indexLabels = useMemo(
    () => rows.map((_, i) => `${i + 1} OF ${total}`),
    [rows, total],
  );

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div
          className="animate-pulse"
          style={{
            width: '100%',
            height: HERO_H,
            borderRadius: 18,
            background: 'rgba(15,23,42,0.06)',
          }}
        />
      </div>
    );
  }

  if (total === 0) return null;

  const isSolo = total <= 1;

  return (
    <div>
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: isSolo ? 'hidden' : 'auto',
          scrollSnapType: isSolo ? 'none' : 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingLeft: 16,
          paddingRight: 16,
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {rows.map((row, i) => (
          <div
            key={`${row.course_id ?? 'c'}-${i}`}
            data-idx={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{
              flex: '0 0 auto',
              width: isSolo ? '100%' : '90%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            <HeroCard
              row={row}
              isSolo={isSolo}
              showPager={!isSolo}
              indexLabel={indexLabels[i]}
              onTap={() => onRowTap?.(row)}
            />
          </div>
        ))}
      </div>
      {!isSolo ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
          }}
          aria-hidden="true"
        >
          {rows.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === activeIndex ? 16 : 5,
                height: 5,
                borderRadius: 999,
                background: i === activeIndex ? GOLD : 'rgba(15,23,42,0.18)',
                transition: 'width 160ms ease, background 160ms ease',
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LegendaryFeatHero;
