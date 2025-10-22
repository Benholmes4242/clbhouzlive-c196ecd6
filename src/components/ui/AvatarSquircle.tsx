import React from "react";
import { Squircle } from "./squircle";

type Props = {
  size: number;               // e.g., 32, 40, 48, 64, 80
  src: string;
  alt?: string;
  ringColor?: string;         // optional border ring
  ringWidth?: number;         // default 0 = no ring
  className?: string;         // extra positioning classes
  children?: React.ReactNode; // badges (e.g., status dot)
  onLoad?: () => void;        // callback when image loads
};

/**
 * Avatar with iOS-style squircle (continuous corner smoothing via superellipse n=5)
 * Use this instead of circular avatars for authentic Apple-like appearance
 */
export default function AvatarSquircle({
  size,
  src,
  alt = "",
  ringColor,
  ringWidth = 0,
  className = "",
  children,
  onLoad
}: Props) {
  const inner = (
    <>
      <img
        src={src}
        alt={alt}
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover", 
          display: "block" 
        }}
        loading="lazy"
        onLoad={onLoad}
        onError={(e) => {
          // Silently handle error - fallback will be shown via children
          console.warn('Avatar image failed to load:', src);
        }}
      />
      {children}
    </>
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        // If a ring is requested, draw it behind via box-shadow so the squircle mask stays clean
        boxShadow: ringWidth && ringColor ? `0 0 0 ${ringWidth}px ${ringColor} inset` : undefined,
        borderRadius: 0, // ensure no residual rounding
        overflow: "visible"
      }}
    >
      <Squircle width={size} height={size}>{inner}</Squircle>
    </div>
  );
}
