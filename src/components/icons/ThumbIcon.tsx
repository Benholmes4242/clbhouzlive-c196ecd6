import React from 'react';

/**
 * THUMBS UP — THE ONE REACTION GLYPH (BRIEF_ONE_REACTION_GLYPH).
 *
 * Phosphor Icons `thumbs-up`, FILL weight (MIT, no attribution required),
 * pasted inline: viewBox 0 0 256 256, one path, fill="currentColor". It
 * replaced lucide's stroke ThumbsUp, which turned into a solid amber paddle
 * when filled — the cuff line is a bare stroke and vanishes under a matching
 * fill. Mass survives where stroke weight does not.
 *
 * It also replaced ClapIcon: one glyph for every reaction, so a like and a
 * celebrate in the same row read as the same control. Do not redraw, re-crop,
 * add a background, or convert it to a stroked icon.
 *
 * THE PATH HAS TWO SUBPATHS AND THAT IS DELIBERATE. The second,
 * `M32,112H72v88H32Z`, winds against the first, so nonzero fill cuts the gap
 * that separates the cuff from the palm. PASTE IT VERBATIM — do not "simplify"
 * it, reorder it, or add fill-rule.
 *
 * STATE IS CARRIED BY COLOUR. `fill`, `stroke` and `strokeWidth` are accepted
 * and ignored so existing lucide-shaped call sites still typecheck.
 *
 * `color` IS ONLY EMITTED WHEN GIVEN. ClapIcon defaulted it to 'currentColor'
 * and always wrote it into inline style; because `color: currentColor` computes
 * to `inherit`, that silently defeated any caller colouring the glyph with a
 * className alone (LoopCard's `text-muted-foreground`, OverlayCorners'
 * `text-white`). Omitting it lets the class cascade normally.
 */
export interface ThumbIconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'fill' | 'strokeWidth' | 'stroke'> {
  size?: number | string;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

const ThumbIcon: React.FC<ThumbIconProps> = ({
  size = 24,
  color,
  fill: _fill,
  stroke: _stroke,
  strokeWidth: _sw,
  style,
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width={size}
    height={size}
    style={color !== undefined ? { color, ...style } : style}
    {...rest}
  >
    <path
      fill="currentColor"
      d="M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32Z"
    />
  </svg>
);

export default ThumbIcon;
