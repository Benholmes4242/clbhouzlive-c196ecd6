import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  visibleOnline: boolean;
  openToPlay: boolean;
  onToggleVisibleOnline: (next: boolean) => void;
  onToggleOpenToPlay: (next: boolean) => void;
  onClose: () => void;
};

export function PlayersNearYouHeader({
  visibleOnline,
  openToPlay,
  onToggleVisibleOnline,
  onToggleOpenToPlay,
  onClose,
}: Props) {
  return (
    <div className="gny-header">
      <h2 className="gny-title">Golfers near you</h2>

      <div className="gny-right">
        <div className="gny-controls">
          <button
            type="button"
            className={`gny-toggle gny-toggle-online ${visibleOnline ? 'is-on' : 'is-off'}`}
            aria-pressed={visibleOnline}
            onClick={() => onToggleVisibleOnline(!visibleOnline)}
          >
            {visibleOnline ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>Visible online</span>
          </button>

          <button
            type="button"
            className={`gny-toggle gny-toggle-open ${openToPlay ? 'is-on' : 'is-off'}`}
            aria-pressed={openToPlay}
            onClick={() => onToggleOpenToPlay(!openToPlay)}
          >
            <span>Open to play</span>
          </button>
        </div>

        <button
          type="button"
          className="gny-close"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
