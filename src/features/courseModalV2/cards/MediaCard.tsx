import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MediaCard({ courseId, variant = 'preview' }:
  { courseId: string; variant?: 'preview' | 'full'; }) {
  return (
    <Card>
      <CardHeader><CardTitle>Media</CardTitle></CardHeader>
      <CardContent>
        {variant === 'preview' ? (
          <div className="grid grid-cols-3 gap-2">
            {/* TODO: replace with real thumbnails */}
            {[1,2,3].map(i => <div key={i} className="aspect-video rounded-lg bg-muted" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {[...Array(9)].map((_,i) => <div key={i} className="aspect-video rounded-lg bg-muted" />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}