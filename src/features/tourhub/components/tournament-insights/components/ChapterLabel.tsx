import { memo, ReactNode } from 'react';

interface ChapterLabelProps {
  children: ReactNode;
}

export const ChapterLabel = memo(function ChapterLabel({ children }: ChapterLabelProps) {
  return (
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
      {children}
    </p>
  );
});
