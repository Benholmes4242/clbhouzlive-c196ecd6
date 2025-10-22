// src/components/echo/EchoOrb.tsx
import React from "react";
import "./echo-orb.css";

type EchoOrbProps = {
  onClick?: () => void;
  state?: "idle" | "listening"; // control ripple
  label?: string;
  className?: string;
};

export default function EchoOrb({
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
      className={[
        "echo-orb",
        state === "listening" ? "is-listening" : "is-idle",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      <span className="echo-orb__wordmark">echo</span>
    </button>
  );
}
