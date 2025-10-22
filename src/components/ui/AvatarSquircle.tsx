import React from "react";

/** Superellipse path (Lamé curve) — iOS-like continuous corners.
 *  Using n=4.2 gives a softer, Apple-like curve at small sizes.
 */
function superellipsePath(w: number, h: number, n = 4.2, steps = 240) {
  const a = w / 2, b = h / 2, m = 2 / n;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m) + a;
    const y = Math.sign(st) * b * Math.pow(Math.abs(st), m) + b;
    pts.push(`${x},${y}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

type Props = {
  size: number;               // e.g., 32, 40, 64, 84
  src: string;                // image URL
  alt?: string;
  ringColor?: string;         // e.g., "#6e9277"
  ringWidth?: number;         // e.g., 2 (0 = none)
  className?: string;
  children?: React.ReactNode; // badges (status dot, etc.)
  onLoad?: () => void;        // callback when image loads
};

/** Safari-safe: <image> + clipPath (no foreignObject).
 *  The ring is drawn with the SAME squircle path, so edges match perfectly.
 */
export default function AvatarSquircle({
  size,
  src,
  alt = "",
  ringColor,
  ringWidth = 0,
  className,
  children,
  onLoad
}: Props) {
  const id = React.useId();
  const d = superellipsePath(size, size, 4.2, 240);

  return (
    <div className={className} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
        </defs>

        {ringWidth > 0 && (
          <path d={d} fill="none" stroke={ringColor} strokeWidth={ringWidth} />
        )}

        <image
          href={src}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${id})`}
          onLoad={onLoad}
        />
      </svg>

      {children /* e.g., a green online dot absolutely positioned here */}
    </div>
  );
}
