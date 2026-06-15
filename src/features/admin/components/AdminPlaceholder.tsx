import React from 'react';
import { Construction } from 'lucide-react';
import EmptyState from './EmptyState';

export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <EmptyState
        icon={<Construction size={36} />}
        title={title}
        subtitle="Coming in the next phase."
      />
    </div>
  );
}
