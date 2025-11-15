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
 * 🎯 SINGLE SOURCE OF TRUTH FOR USER AVATARS 🎯
 * 
 * iOS-style squircle container with continuous corner smoothing (superellipse n=5)
 * 
 * ✅ THIS IS THE ONLY ALLOWED COMPONENT FOR USER AVATARS
 * ❌ DO NOT use Avatar, OptimizedAvatar, AvatarSquircle, or any other avatar components
 * ❌ DO NOT use rounded-full, rounded-lg, or custom border-radius for user photos
 * 
 * ALL user avatars across the entire application MUST use this component directly
 * for visual consistency with Apple's design language.
 * 
 * @example User avatar
 * <Squircle width={48} height={48}>
 *   <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 * </Squircle>
 * 
 * @param width - Width in pixels
 * @param height - Height in pixels  
 * @param children - Content to display (typically an img element)
 * @param className - Optional additional CSS classes
 */
export const Squircle: React.FC<SquircleProps> = ({ 
  width = 80, 
  height = 80, 
  children,
  className = ""
}) => {
  const id = React.useId();
  const d = superellipsePath(width, height, 5, 160);
  
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
