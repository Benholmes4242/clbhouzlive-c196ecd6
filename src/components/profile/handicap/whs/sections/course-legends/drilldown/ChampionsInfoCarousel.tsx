import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ShieldCheck, X } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const KEY_EXPLAINER = 'champions_explainer_dismissed_v1';
const KEY_PROVENANCE = 'champions_provenance_dismissed_v1';

const read = (k: string) => {
  try { return localStorage.getItem(k) === '1'; } catch { return false; }
};
const write = (k: string) => {
  try { localStorage.setItem(k, '1'); } catch { /* ignore */ }
};

interface Props {
  window: 'all_time' | '90d';
}

interface CardShellProps {
  onDismiss: () => void;
  background: string;
  border: string;
  children: React.ReactNode;
}

const CardShell: React.FC<CardShellProps> = ({ onDismiss, background, border, children }) => (
  <div
    style={{
      position: 'relative',
      padding: '13px 38px 13px 14px',
      background,
      border,
      borderRadius: 14,
      fontFamily: FONT,
      boxSizing: 'border-box',
      height: '100%',
    }}
  >
    <button
      type="button"
      aria-label="Dismiss"
      onClick={onDismiss}
      style={{
        position: 'absolute', top: 9, right: 9, width: 22, height: 22,
        borderRadius: 999, border: 'none', background: 'var(--hcp-tint-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <X size={11} color="var(--hcp-t-60)" strokeWidth={2.6} />
    </button>
    {children}
  </div>
);

const ExplainerContent: React.FC<{ window: 'all_time' | '90d' }> = ({ window }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <Crown size={12} color="#B26818" strokeWidth={2.6} fill="#FBBC2E" />
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--hcp-gold-text)', textTransform: 'uppercase' }}>
        What are Champions?
      </span>
    </div>
    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--hcp-t-60)', lineHeight: 1.55, margin: 0 }}>
      The clubhouse records board, digitalised. Lowest gross, best stableford, most birdies
      and more — ranked from{' '}
      <b style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>official WHS scores</b>{' '}
      at this course, {window === 'all_time' ? 'all time' : 'over the last 90 days'}.
    </p>
  </>
);

const ProvenanceContent: React.FC<{ onSync: () => void; isSynced: boolean }> = ({ onSync, isSynced }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <ShieldCheck size={12} color="var(--hcp-gold-text)" strokeWidth={2.6} />
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--hcp-gold-text)', textTransform: 'uppercase' }}>
        Official scores only
      </span>
    </div>
    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--hcp-t-60)', lineHeight: 1.55, margin: 0 }}>
      That ace only counts if it's on your{' '}
      <b style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>official handicap record</b>.
      Log every round with your club or golf union to register it on your WHS record — no logged rounds, no crowns.
      {!isSynced && (
        <>{' '}
          <b
            role="button"
            onClick={onSync}
            style={{ color: 'var(--hcp-gold-text)', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            Sync your handicap ›
          </b>
        </>
      )}
    </p>
  </>
);

export const ChampionsInfoCarousel: React.FC<Props> = ({ window }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: whsConnection } = useWhsConnection(user?.id);
  const isSynced = !!whsConnection;
  const [gone1, setGone1] = useState(() => read(KEY_EXPLAINER));
  const [gone2, setGone2] = useState(() => read(KEY_PROVENANCE));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  const dismissExplainer = () => { setGone1(true); write(KEY_EXPLAINER); };
  const dismissProvenance = () => { setGone2(true); write(KEY_PROVENANCE); };

  const bothVisible = !gone1 && !gone2;

  useEffect(() => {
    if (!bothVisible) return;
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = el.clientWidth - 24 + 8; // card width + gap approx
      const idx = Math.round(el.scrollLeft / Math.max(1, cardWidth));
      setActiveDot(Math.max(0, Math.min(1, idx)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [bothVisible]);

  if (gone1 && gone2) return null;

  const explainerCard = (
    <CardShell
      onDismiss={dismissExplainer}
      background="var(--hcp-bg-1)"
      border="0.5px solid var(--hcp-line)"
    >
      <ExplainerContent window={window} />
    </CardShell>
  );

  const provenanceCard = (
    <CardShell
      onDismiss={dismissProvenance}
      background="linear-gradient(180deg, rgba(251,188,46,0.09), rgba(251,188,46,0.03))"
      border="0.5px solid rgba(251,188,46,0.35)"
    >
      <ProvenanceContent onSync={() => navigate('/handicap')} />
    </CardShell>
  );

  if (bothVisible) {
    return (
      <div style={{ margin: '12px 0 0' }}>
        <div
          ref={scrollerRef}
          className="hcp-info-carousel-scroller"
          style={{
            padding: '0 16px',
            overflowX: 'auto',
            display: 'flex',
            gap: 8,
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: 16,
            alignItems: 'stretch',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          <style>{`.hcp-info-carousel-scroller::-webkit-scrollbar{display:none}`}</style>
          <div style={{ flexShrink: 0, width: 'calc(100% - 24px)', scrollSnapAlign: 'start' }}>
            {explainerCard}
          </div>
          <div style={{ flexShrink: 0, width: 'calc(100% - 24px)', scrollSnapAlign: 'start' }}>
            {provenanceCard}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 7 }}>
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: activeDot === i ? 'var(--hcp-t-60)' : 'var(--hcp-tint-1)',
                transition: 'background 160ms ease',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Single card full-width
  return (
    <div style={{ margin: '12px 16px 0' }}>
      {!gone1 ? explainerCard : provenanceCard}
    </div>
  );
};

export default ChampionsInfoCarousel;
