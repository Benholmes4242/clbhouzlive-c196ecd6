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

  const a11y = isError
    ? 'Nearby Golfers unavailable. Double tap to retry.'
    : isOpenToPlay
      ? `Nearby Golfers. You are Open to Play. ${count} nearby. Double tap to open.`
      : `Nearby Golfers. ${count} nearby. Double tap to open.`;

  return (
    <TapButton
      className={`nearby-golfers-squircle ${isOpenToPlay ? 'on' : ''} ${visibility} ${isError ? 'err' : ''}`}
      onPointerDown={handleTap}
      aria-label={a11y}
    >
      <div className="ring">
        <div className="sweep" />
      </div>

      <div className="glyph" aria-hidden>📡</div>

      <div className="title">Nearby Golfers</div>

      <div className={`pill ${isOpenToPlay ? 'green' : ''}`}>
        {isLoading ? '•••' : `${count} nearby`}
      </div>

      {isOpenToPlay && <div className="otpDot" aria-hidden>🏌️‍♂️</div>}
      
      {visibility !== 'everyone' && (
        <div className="visChip" aria-hidden>
          {visibility === 'friends' ? '👥 Friends' : '⛔️ Hidden'}
        </div>
      )}

      {isError && (
        <div 
          className="errBadge" 
          onPointerDown={(e) => {
            e.stopPropagation();
            refetch();
          }} 
          aria-hidden
        >
          ⚠️
        </div>
      )}
    </TapButton>
  );
}
