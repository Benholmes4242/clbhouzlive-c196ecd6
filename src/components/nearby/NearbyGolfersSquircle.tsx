import React from "react";
import { TapButton } from "@/components/ui/TapButton";
import { haptic } from "@/utils/haptics";
import { useNearbySquircle } from "@/hooks/useNearbySquircle";
import "./NearbyGolfersSquircle.css";

interface NearbyGolfersSquircleProps {
  onOpen: () => void;
}

export default function NearbyGolfersSquircle({ onOpen }: NearbyGolfersSquircleProps) {
  const { count, visibility, isOpenToPlay, isLoading, isError, refetch } = useNearbySquircle();

  const handleTap = () => {
    haptic('light');
    onOpen();
  };

  const handleRetry = (e: React.PointerEvent) => {
    e.stopPropagation();
    haptic('medium');
    refetch();
  };

  const a11y = isError
    ? 'Nearby Golfers unavailable. Double tap to retry.'
    : isOpenToPlay
      ? `Nearby Golfers. You are Open to Play. ${count} nearby. Double tap to open.`
      : `Nearby Golfers. ${count} nearby. Double tap to open.`;

  return (
    <TapButton
      className={`sq ${isOpenToPlay ? 'on' : ''} vis-${visibility} ${isError ? 'err' : ''}`}
      onPointerDown={handleTap}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={a11y}
    >
      {/* Radar + sweep */}
      <div className="ring" aria-hidden>
        <div className={`sweep ${isLoading ? 'slow' : ''}`} />
      </div>

      {/* Glyph */}
      <div className="glyph" aria-hidden>📡</div>

      {/* Title */}
      <div className="title">Nearby Golfers</div>

      {/* Count pill */}
      <div className={`pill ${isOpenToPlay ? 'green' : ''} ${count > 0 ? 'active' : ''}`}>
        {isLoading ? '•••' : `${count} nearby`}
      </div>

      {/* Visibility chip */}
      {visibility !== 'everyone' && (
        <div className="visChip" aria-hidden>
          {visibility === 'friends' ? '👥 Friends' : '⛔️ Hidden'}
        </div>
      )}

      {/* Halo pulse when Open to Play */}
      {isOpenToPlay && <div className="haloPulse" aria-hidden />}

      {/* Error badge (tap to retry) */}
      {isError && (
        <div className="errBadge" aria-hidden onPointerDown={handleRetry}>
          ⚠️
        </div>
      )}
    </TapButton>
  );
}
