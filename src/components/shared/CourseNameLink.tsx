/**
 * CourseNameLink — THE ONE TAPPABLE COURSE NAME ON REVIEW SURFACES (CB69).
 *
 * Rule, held here once:
 * - With a course id (or an explicit `onNavigate`), the name is a real
 *   <button> that opens /courses/:courseId. Without one it is plain text —
 *   a course is NEVER looked up by name.
 * - The tap belongs to the name alone: click, pointer-down, double-click and
 *   key events stop propagating, so the enclosing tile does not open the
 *   review, the fullscreen viewer does not pause / like / swipe (its window
 *   listener already skips presses whose path contains a BUTTON).
 * - `onBeforeNavigate` runs first so a sheet / fullscreen viewer closes before
 *   the course page opens (ReviewBottomSheet.handleGoToReview's order).
 * - Layout is unchanged: the text element keeps the caller's style and data
 *   attributes in both modes; the 44px minimum target is an invisible,
 *   absolutely positioned hit area that takes no space.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

type DataAttrs = Record<`data-${string}`, string | boolean | undefined>;

export interface CourseNameLinkProps {
  courseId?: string | null;
  children: React.ReactNode;
  /** Style of the text element — identical in link and plain modes. */
  style?: React.CSSProperties;
  /** Data attributes for the text element. */
  textProps?: DataAttrs;
  /** Element used for the text in both modes. */
  as?: 'span' | 'div';
  /** Layout style for the button (flex item sizing etc). Link mode only. */
  wrapperStyle?: React.CSSProperties;
  /** Runs before navigation: close sheets / the fullscreen viewer here. */
  onBeforeNavigate?: () => void;
  /** Replaces the default navigation (callers that already own the route). */
  onNavigate?: () => void;
  ariaLabel?: string;
}

const HIT: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '50%',
  height: 'max(100%, 44px)',
  minHeight: 44,
  transform: 'translateY(-50%)',
};

export function CourseNameLink({
  courseId,
  children,
  style,
  textProps,
  as = 'span',
  wrapperStyle,
  onBeforeNavigate,
  onNavigate,
  ariaLabel,
}: CourseNameLinkProps) {
  const navigate = useNavigate();
  const Text = as;
  const linked = !!courseId || !!onNavigate;

  if (!linked) {
    return <Text {...textProps} style={style}>{children}</Text>;
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBeforeNavigate?.();
    if (onNavigate) onNavigate();
    else navigate(`/courses/${courseId}`);
  };

  return (
    <button
      type="button"
      data-course-name-link=""
      aria-label={ariaLabel}
      onClick={open}
      onPointerDown={stop}
      onPointerUp={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
      onDoubleClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
      style={{
        position: 'relative',
        display: as === 'div' ? 'block' : 'inline-block',
        width: as === 'div' ? '100%' : undefined,
        maxWidth: '100%',
        minWidth: 0,
        margin: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'inherit',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        ...wrapperStyle,
      }}
    >
      <span aria-hidden data-course-name-hit="" style={HIT} />
      <Text {...textProps} style={{ position: 'relative', ...(as === 'span' ? { display: 'block' } : null), ...style }}>{children}</Text>
    </button>
  );
}

export default CourseNameLink;
