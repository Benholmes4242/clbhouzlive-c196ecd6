// src/components/echo/EchoOrbGlass.tsx
import React from "react";
import "./echo-orb-glass-dom.css";

export type EchoOrbProps = {
  state?: "idle" | "listening";
  onClick?: () => void;
  label?: string;
  className?: string;
};

export default function EchoOrbGlass({
  state = "idle",
  onClick,
  label = "Open Echo — your AI golf assistant",
  className = "",
}: EchoOrbProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Echo"
      data-variant="glass"
      className={[
        "echo-orb",
        state === "listening" ? "is-listening" : "is-idle",
        className,
      ].join(" ")}
      onClick={onClick}
      style={{
        // Inline base guarantees the blur appears in Safari
        background: "transparent",
        backgroundColor: "rgba(255,255,255,0.001)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        backdropFilter: "blur(12px) saturate(180%)",
      }}
    >
      {/* Under-glass brand gradient */}
      <span aria-hidden className="echo-orb__layer echo-orb__gradient" />
      {/* Glass skin: gloss + tint + rim */}
      <span aria-hidden className="echo-orb__layer echo-orb__glass" />
      {/* Optional ripple moved to child to avoid ::after conflicts */}
      <span aria-hidden className="echo-orb__layer echo-orb__ripple" />
      <span className="echo-orb__wordmark">echo</span>
    </button>
  );
}
