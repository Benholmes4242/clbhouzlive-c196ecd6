import React from "react";

function superellipsePath(w: number, h: number, n = 5, steps = 200) {
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
  size: number;              // e.g. 84
  src: string;
  alt?: string;
  ringColor?: string;        // e.g. '#6e9277'
  ringWidth?: number;        // e.g. 2
  className?: string;
};

export default function SquircleImage({
  size,
  src,
  alt = "",
  ringColor,
  ringWidth = 0,
  className
}: Props) {
  const id = React.useId();
  const d = superellipsePath(size, size, 5, 220);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
      aria-label={alt}
      role="img"
    >
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <path d={d} />
        </clipPath>
      </defs>

      {ringWidth > 0 && (
        <path d={d} fill="none" stroke={ringColor} strokeWidth={ringWidth} />
      )}

      {/* Safari-safe: use <image> + clipPath (avoid foreignObject) */}
      <image
        href={src}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${id})`}
      />
    </svg>
  );
}
