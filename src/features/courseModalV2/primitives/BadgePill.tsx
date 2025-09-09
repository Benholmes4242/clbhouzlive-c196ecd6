import React from 'react';
export default function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-1 text-sm font-medium text-white backdrop-blur">
      {children}
    </span>
  );
}