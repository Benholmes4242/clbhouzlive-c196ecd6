import React from 'react';

type SquircleProps = React.PropsWithChildren<{
  size: number;           // e.g. 64
  corner?: number;        // 0.2–0.6, default ~0.55 (iOS-ish)
  className?: string;
}>;

/**
 * iOS-style Squircle (Superellipse) component
 * Creates a mathematically perfect rounded square shape using SVG mask
 */
export function Squircle({ size, corner = 0.55, className = '', children }: SquircleProps) {
  // iOS-like superellipse path (normalized 0-100, scales via viewBox)
  const path = `
    M50 0
    C ${(50 + 50*corner)} 0, 100 ${(50 - 50*corner)}, 100 50
    C 100 ${(50 + 50*corner)}, ${(50 + 50*corner)} 100, 50 100
    C ${(50 - 50*corner)} 100, 0 ${(50 + 50*corner)}, 0 50
    C 0 ${(50 - 50*corner)}, ${(50 - 50*corner)} 0, 50 0 Z
  `.replace(/\s+/g,' ');

  const maskUrl = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='${path}' fill='black'/></svg>")`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: maskUrl,
        WebkitMaskSize: 'cover',
        maskImage: maskUrl,
        maskSize: 'cover'
      }}
    >
      {children}
    </div>
  );
}
