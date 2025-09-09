import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutCard({ course }: { course: { name: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle>About</CardTitle></CardHeader>
      <CardContent>
        <p className={expanded ? '' : 'line-clamp-5 text-muted-foreground'}>
          {/* TODO: replace with real course.description */}
          Together with the Old Course, the New Course at {course.name} offers one of the finest
          36-hole experiences in the British Isles. It was designed by Harry Colt and opened in 1923. 
          Members later approved routing refinements to improve flow and playability while maintaining strategic depth.
        </p>
        <Button variant="ghost" className="mt-2 px-0"
          onClick={() => setExpanded(s => !s)}>
          {expanded ? 'Read less' : 'Read more'}
        </Button>
      </CardContent>
    </Card>
  );
}