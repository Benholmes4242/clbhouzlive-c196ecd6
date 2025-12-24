import { ReactNode } from 'react';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  return (
    <div className="min-h-screen bg-clbhouzBg">
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {children}
      </div>
    </div>
  );
}
