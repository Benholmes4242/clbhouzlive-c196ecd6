import React from 'react';

interface PeopleListProps {
  label: string;
  count: number;
  children: React.ReactNode;
}

export function PeopleList({ label, count, children }: PeopleListProps) {
  return (
    <div className="mt-2">
      {/* Count label */}
      <div className="px-4 pb-2">
        <span className="text-sm text-muted-foreground">
          {label} · {count}
        </span>
      </div>

      {/* List with dividers */}
      <div className="divide-y divide-border/40">
        {children}
      </div>
    </div>
  );
}
