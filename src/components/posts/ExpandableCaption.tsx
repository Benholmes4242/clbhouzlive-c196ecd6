import React, { useLayoutEffect, useRef, useState } from 'react';

interface ExpandableCaptionProps {
  /** Inner content to render inside the clamp container.
   *  Pass a single React element (e.g. <PostContentWithTags />) or plain text. */
  children: React.ReactNode;
  /** Number of lines to clamp to before expansion. Default 2. */
  lines?: number;
  /** className applied to the clamp container (typography lives here:
   *  font-size, font-weight, color, line-height, etc.). */
  className?: string;
  /** Inline style override for edge cases. */
  style?: React.CSSProperties;
  /** Optional aria-label for the expand button. Default 'Show more'. */
  expandLabel?: string;
  /** Optional aria-label for the collapse button. Default 'Show less'. */
  collapseLabel?: string;
}

/**
 * Caption renderer with measured truncation.
 * When the inner content overflows the clamp height, renders an inline
 * "…more" affordance on a new line beneath. Tapping the whole collapsed
 * region (text + affordance) expands it; tapping inner mentions/links
 * still routes to those targets via stopPropagation in the consumer.
 */
export const ExpandableCaption: React.FC<ExpandableCaptionProps> = ({
  children,
  lines = 2,
  className,
  style,
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
}) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Measure overflow whenever content or container size changes.
  // useLayoutEffect avoids a flash of un-measured "…more" affordance on first paint.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      // +1 absorbs sub-pixel rounding errors on retina screens.
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setIsOverflowing(overflow);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    // If the user tapped a mention/tag/link inside the caption, that element
    // stops propagation; this handler only fires for taps on plain text or
    // the wrapper itself.
    e.stopPropagation();
    setIsExpanded((v) => !v);
  };

  // When collapsed AND overflowing, the whole region is tap-to-expand.
  // When expanded, only the trailing "less" is interactive.
  const wholeRegionIsButton = !isExpanded && isOverflowing;

  const clampStyle: React.CSSProperties = isExpanded
    ? {}
    : {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      };

  return (
    <div
      onClick={wholeRegionIsButton ? handleToggle : undefined}
      role={wholeRegionIsButton ? 'button' : undefined}
      tabIndex={wholeRegionIsButton ? 0 : undefined}
      aria-expanded={isOverflowing ? isExpanded : undefined}
      aria-label={wholeRegionIsButton ? expandLabel : undefined}
      onKeyDown={
        wholeRegionIsButton
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(e);
              }
            }
          : undefined
      }
      style={{
        ...style,
        cursor: wholeRegionIsButton ? 'pointer' : 'default',
      }}
    >
      <div ref={measureRef} className={className} style={clampStyle}>
        {children}
      </div>

      {isOverflowing && !isExpanded && (
        <button
          type="button"
          onClick={handleToggle}
          className={className}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            color: 'rgba(15,23,42,0.55)',
            cursor: 'pointer',
            display: 'block',
            textAlign: 'left',
          }}
          aria-label={expandLabel}
        >
          …more
        </button>
      )}

      {isOverflowing && isExpanded && (
        <button
          type="button"
          onClick={handleToggle}
          className={className}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginLeft: 4,
            color: 'rgba(15,23,42,0.55)',
            cursor: 'pointer',
            display: 'inline',
          }}
          aria-label={collapseLabel}
        >
          less
        </button>
      )}
    </div>
  );
};

export default ExpandableCaption;
