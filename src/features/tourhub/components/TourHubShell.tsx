import { ReactNode } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  return (
    <PageRoot className="min-h-screen bg-clbhouzBg safe-top w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 pb-[var(--page-bottom-padding)]">
        {children}
      </div>
    </PageRoot>
  );
}
