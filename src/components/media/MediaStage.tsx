import React from 'react';

interface MediaStageProps {
  children: React.ReactNode;
}

export function MediaStage({ children }: MediaStageProps) {
  return (
    <div
      className="
        relative w-full h-[100dvh]
        bg-black
        overflow-hidden
        grid place-items-center
      "
    >
      {children}
    </div>
  );
}