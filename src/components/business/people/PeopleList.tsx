import React from 'react';

interface PeopleListProps {
  children: React.ReactNode;
}

export function PeopleList({ children }: Omit<PeopleListProps, 'label' | 'count'>) {
  return (
    <div className="mt-2 divide-y divide-border/40">
      {children}
    </div>
  );
}
