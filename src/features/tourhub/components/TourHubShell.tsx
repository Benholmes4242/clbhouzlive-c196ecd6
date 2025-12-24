import { ReactNode } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  return (
    <PageRoot className="min-h-screen bg-clbhouzBg safe-top">
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
