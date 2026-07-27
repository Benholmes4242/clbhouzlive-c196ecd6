import type { ReactNode } from 'react';
import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { FONT } from './gamingLightTokens';

/**
 * CinematicLeadCard - full-bleed lead entry for a Discover vertical list.
 *
 * Edge to edge (no side padding), matching how StatBrowse renders a course
 * card: image, dark bottom scrim, glass chips top-left, title + subtitle
 * bottom-left, a large figure bottom-right with a small label beneath.
 *
 * If the caller has no image it must render the entry as a normal row
 * instead - this component never paints an empty gradient block, so callers
 * should guard with `imageUrl ? <CinematicLeadCard/> : <Row/>`.
 */

export interface CinematicChip {
  label: string;
  /** 'glass' = neutral dark glass; 'danger' = red glass; 'good' = green glass. */
  tone?: 'glass' | 'danger' | 'good';
}

const CHIP_TONE: Record<string, { bg: string; border: string; fg: string }> = {
  glass: {
    bg: 'rgba(12,18,14,0.58)',
    border: 'rgba(255,255,255,0.18)',
    fg: '#FFFFFF',
  },
  danger: {
    bg: 'rgba(210,34,45,0.72)',
    border: 'rgba(255,255,255,0.22)',
    fg: '#FFFFFF',
  },
  good: {
    bg: 'rgba(15,143,74,0.72)',
    border: 'rgba(255,255,255,0.22)',
    fg: '#FFFFFF',
  },
};

interface Props {
  imageUrl: string;
  alt?: string;
  chips?: CinematicChip[];
  title: string;
  subtitle?: ReactNode;
  /** Large figure, bottom right. */
  figure: ReactNode;
  /** Small uppercase label under the figure. */
  figureLabel?: string;
  /** 0..100 progress bar rendered beneath the figure block. */
  progressPct?: number | null;
  progressColor?: string;
  onTap?: () => void;
}

export function CinematicLeadCard({
  imageUrl,
  alt,
  chips = [],
  title,
  subtitle,
  figure,
  figureLabel,
  progressPct = null,
  progressColor = '#F7931E',
  onTap,
}: Props) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full text-left active:opacity-95 transition-opacity"
      style={{
        display: 'block',
        width: '100%',
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: onTap ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', overflow: 'hidden' }}>
        <img
          src={getOptimizedImageUrl(imageUrl, { width: 800 })}
          srcSet={generateImageSrcSet(imageUrl, [{ width: 480 }, { width: 800 }, { width: 1200 }])}
          sizes="100vw"
          alt={alt ?? title}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Bottom scrim */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.04) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Chips - top left, on glass */}
        {chips.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {chips.map((c) => {
              const tone = CHIP_TONE[c.tone ?? 'glass'];
              return (
                <span
                  key={c.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: tone.bg,
                    color: tone.fg,
                    border: `1px solid ${tone.border}`,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    padding: '3px 6px',
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {c.label}
                </span>
              );
            })}
          </div>
        ) : null}

        {/* Bottom row - title/subtitle left, figure right */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 12,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                textShadow: '0 1px 6px rgba(0,0,0,0.45)',
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.80)',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 2px 10px rgba(0,0,0,0.45)',
              }}
            >
              {figure}
            </div>
            {figureLabel ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {figureLabel}
              </div>
            ) : null}
          </div>
        </div>

        {progressPct != null ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              background: 'rgba(255,255,255,0.22)',
            }}
          >
            <div
              style={{
                width: `${Math.max(6, Math.min(100, progressPct))}%`,
                height: '100%',
                background: progressColor,
              }}
            />
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default CinematicLeadCard;
