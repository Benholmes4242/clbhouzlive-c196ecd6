import { useEffect, useMemo, useRef, useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { prefersReduced } from '@/lib/ui/motion';
import { useRegionFeats } from './hooks/useRegionFeats';

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
  onRowTap?: (row: import('./hooks/useRegionFeats').FeatRow) => void;
}

export function LegendaryFeatHero({ region, onRowTap }: Props) {
  const { data, isLoading } = useRegionFeats(region, 'legendary');
  const rows = data ?? [];
  const total = rows.length;
  const [index, setIndex] = useState(0);

  const safeIndex = total ? index % total : 0;
  const row = rows[safeIndex];
  const nextRow = total > 1 ? rows[(safeIndex + 1) % total] : null;

  const image = row?.course_image ?? row?.thumbnail_image ?? null;
  const nextImage = nextRow?.course_image ?? nextRow?.thumbnail_image ?? null;
  const holder = useMemo(() => formatHolderName(row?.holder_name), [row?.holder_name]);
  const when = relDate(row?.play_date ?? row?.attained_at ?? null);
  const chip = labelFor(row?.feat_type);
  const value = (row?.feat_value ?? '').toUpperCase();

  // Pointer + fade-transition refs must be declared before any early return.
  const pointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const prevIndexRef = useRef(safeIndex);

  useEffect(() => {
    if (prevIndexRef.current === safeIndex) return;
    prevIndexRef.current = safeIndex;
    const node = contentRef.current;
    if (!node) return;
    if (prefersReduced()) return;
    node.style.transition = 'none';
    node.style.opacity = '0';
    // force reflow
    void node.offsetWidth;
    node.style.transition = 'opacity 160ms linear';
    node.style.opacity = '1';
  }, [safeIndex]);

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

  if (!row) return null;

  const showPager = total > 1;

  const cycleNext = () => {
    if (total > 1) setIndex((i) => (i + 1) % total);
  };
  const cyclePrev = () => {
    if (total > 1) setIndex((i) => (i - 1 + total) % total);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start) {
      if (onRowTap && row) onRowTap(row);
      else cycleNext();
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (total > 1 && absX >= 40 && absX > absY * 1.5) {
      if (dx < 0) cycleNext();
      else cyclePrev();
      return;
    }
    // treat as tap only if small movement in both axes
    if (absX < 10 && absY < 10) {
      if (onRowTap && row) onRowTap(row);
      else cycleNext();
    }
  };
  const onPointerCancel = () => {
    pointerRef.current = null;
  };

  return (
    <div style={{ padding: '0 16px' }}>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="text-left active:scale-[0.995] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          height: HERO_H,
          borderRadius: 18,
          overflow: 'hidden',
          padding: 0,
          border: 'none',
          background: image ? '#07080C' : '#0A0C10',
          cursor: 'pointer',
          fontFamily: FONT,
          boxShadow: `0 0 0 1px ${GOLD}66, 0 6px 20px rgba(0,0,0,0.3)`,
          touchAction: 'pan-y',
        }}
      >
        <div ref={contentRef} style={{ position: 'absolute', inset: 0, opacity: 1 }}>
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

        {/* Dark veil */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(155deg, rgba(10,12,16,0.72), rgba(10,12,16,0.90))',
          }}
        />
        {/* Gold radial bloom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 85% 20%, #FBBC2E26, transparent 55%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top-left eyebrow */}
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

        {/* Lower-left hero value + course */}
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

        {/* Bottom-left: avatar + name */}
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



        {/* Bottom-right pager */}
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
            {safeIndex + 1} OF {total} ›
          </div>
        ) : null}
        </div>
      </button>
    </div>
  );
}

export default LegendaryFeatHero;
