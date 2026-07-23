// PostEmptyStage - "The Clubhouse Wall" empty state for the post composer
// media frame. Warm paper gradient + contour lines + three pinned polaroid
// frames + rotating subline + amber CTA.

import { Plus, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onRequestAdd?: () => void;
}

const ROTATE_MS = 2600;
const FADE_MS = 150;

interface Frame {
  x: number; y: number; w: number; h: number; r: number; fill: string; play?: boolean;
}

// Base geometry authored at 430px container width; scaled proportionally.
const BASE_W = 430;
const FRAMES: Frame[] = [
  { x: 44,  y: 92,  w: 116, h: 138, r: -8, fill: '#DCE6D8' },
  { x: 158, y: 62,  w: 132, h: 156, r: 4,  fill: '#CFE0D2', play: true },
  { x: 276, y: 104, w: 112, h: 132, r: 9,  fill: '#E2E8DC' },
];

// Five gentle S-curves for the paper contour layer.
const CONTOUR_PATHS = [
  'M0 120 Q 107 100 215 122 T 430 118',
  'M0 166 Q 107 190 215 168 T 430 172',
  'M0 212 Q 107 232 215 210 T 430 216',
  'M0 258 Q 107 240 215 262 T 430 258',
  'M0 304 Q 107 326 215 302 T 430 308',
];

const PHRASE_KEYS = [
  'emptyState.phrases.0',
  'emptyState.phrases.1',
  'emptyState.phrases.2',
  'emptyState.phrases.3',
];

export default function PostEmptyStage({ onRequestAdd }: Props) {
  const { t } = useTranslation('composer');
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(BASE_W);
  const [phraseIdx, setPhraseIdx] = useState(0);
  // "out" = fading down to 0, "in" = fading up to 1. We only swap the
  // string when the opacity transition has fully reached 0 — so the DOM
  // never contains fragments of two phrases at once.
  const [fade, setFade] = useState<'in' | 'out'>('in');
  const pendingSwap = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setWidth(r.width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      // Kick off the fade-out. The actual string swap + fade-in happens
      // inside onTransitionEnd once opacity has landed on 0.
      pendingSwap.current = true;
      setFade('out');
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const handleTransitionEnd = () => {
    if (!pendingSwap.current) return;
    if (fade === 'out') {
      pendingSwap.current = false;
      setPhraseIdx((i) => (i + 1) % PHRASE_KEYS.length);
      setFade('in');
    }
  };

  const k = width / BASE_W;

  return (
    <div
      ref={wrapRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(170deg, #FBF7F0 0%, #F3EDE2 55%, #EFE7D9 100%)',
      }}
    >
      {/* Layer 1: contour lines */}
      <svg
        aria-hidden
        viewBox={`0 0 ${BASE_W} 400`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      >
        {CONTOUR_PATHS.map((d, i) => (
          <path key={i} d={d} stroke="rgba(30,58,43,0.09)" strokeWidth={1.5} fill="none" />
        ))}
      </svg>

      {/* Layer 2: polaroid frames */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {FRAMES.map((f, i) => {
          const w = f.w * k;
          const h = f.h * k;
          const x = f.x * k;
          const y = f.y * k;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                background: '#FFFFFF',
                borderRadius: 6,
                padding: 7 * k,
                paddingBottom: 22 * k,
                boxSizing: 'border-box',
                transform: `rotate(${f.r}deg)`,
                boxShadow: '0 6px 18px rgba(30,42,30,0.13), 0 1px 3px rgba(30,42,30,0.10)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: f.fill,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f.play && (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingLeft: 3,
                    }}
                  >
                    <Play size={13} color="#1E3A2B" fill="#1E3A2B" />
                  </div>
                )}
              </div>
              {/* Pin */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#F7931E',
                  transform: 'translateX(-50%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Layer 3: copy + CTA */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 26,
          padding: '0 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#1E3A2B',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          {t('emptyState.headline')}
        </div>
        <div
          aria-hidden
          style={{
            marginTop: 5,
            fontSize: 13.5,
            color: 'rgba(30,58,43,0.62)',
            height: 19,
            lineHeight: '19px',
            opacity: phraseVisible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
        >
          {t('emptyState.shareLead', {
            phrase: t(PHRASE_KEYS[phraseIdx]),
          })}
        </div>
        <button
          type="button"
          onClick={onRequestAdd}
          aria-label={t('emptyState.ctaLabel')}
          style={{
            marginTop: 16,
            border: 0,
            borderRadius: 999,
            padding: '14px 30px',
            background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
            color: '#FFFFFF',
            fontSize: 15.5,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(247,147,30,0.34)',
          }}
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>{t('emptyState.ctaLabel')}</span>
        </button>
        <div
          style={{
            marginTop: 11,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(30,58,43,0.45)',
          }}
        >
          {t('emptyState.microcopy')}
        </div>
      </div>
    </div>
  );
}
