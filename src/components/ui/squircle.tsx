import React from "react";

/**
 * Generate superellipse path (Lamé curve) for iOS-style continuous corners
 * @param w - Width
 * @param h - Height
 * @param n - Exponent (5 matches iOS icon squircle)
 * @param steps - Number of points for smoothness
 */
function superellipsePath(w: number, h: number, n = 5, steps = 160): string {
  const a = w / 2;
  const b = h / 2;
  const m = 2 / n;
  const pts: [number, number][] = [];
  
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = Math.sign(ct) * a * Math.pow(Math.abs(ct), m);
    const y = Math.sign(st) * b * Math.pow(Math.abs(st), m);
    pts.push([x + a, y + b]);
  }
  
  return `M ${pts.map(p => p.join(",")).join(" L ")} Z`;
}

interface SquircleProps {
  width?: number;
  height?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * SVG-based squircle container with continuous corner smoothing (superellipse n=5)
 * 
 * ⚠️ FOR USER AVATARS: Use <SquircleAvatar> from @/components/ui/SquircleAvatar.tsx instead
 * This SVG-based component should only be used for non-avatar content.
 * 
 * User avatars must use the new CSS-based SquircleAvatar which has:
 * - Aspect ratio: 1 / 1.05 (slightly taller than wide)
 * - Border radius: 34% (continuous soft squircle)
 * - Normal state (no achievement): 1px grey ring
 * - Achievement state: 1px colored ring directly on avatar (no grey ring)
 * 
 * @param width - Width in pixels
 * @param height - Height in pixels  
 * @param children - Content to display
 * @param className - Optional additional CSS classes
 */
export const Squircle: React.FC<SquircleProps> = ({ 
  width = 80, 
  height = 80, 
  children,
  className = ""
}) => {
  const id = React.useId();
  const d = superellipsePath(width, height, 5, 220);
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      style={{ display: "block" }}
      className={className}
    >
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <foreignObject 
        width={width} 
        height={height} 
        clipPath={`url(#${id})`}
      >
        <div style={{ width, height, overflow: "hidden" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};
