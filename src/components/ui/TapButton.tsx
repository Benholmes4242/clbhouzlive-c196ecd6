import React from 'react';

interface TapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/**
 * TapButton - A button component optimized for reliable single-tap interaction
 * 
 * Fixes common mobile tap issues:
 * - Uses pointer events (unified touch/mouse/pen handling)
 * - Prevents 300ms tap delay with touchAction
 * - Avoids double-handler conflicts (touch + click)
 * - Works reliably on first tap
 */
export function TapButton({ 
  children, 
  type = 'button',
  onClick,
  onPointerDown,
  style,
  ...props 
}: TapButtonProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (onPointerDown) {
      onPointerDown(e);
    } else if (onClick) {
      onClick(e as any);
    }
  };

  return (
    <button
      {...props}
      type={type}
      onPointerDown={handlePointerDown}
      onClick={undefined} // Avoid duplicate handler
      style={{ 
        touchAction: 'manipulation', // Kills 300ms delay
        ...style 
      }}
    >
      {children}
    </button>
  );
}
