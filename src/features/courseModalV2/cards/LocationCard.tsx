import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LocationCard({ course }: { course: { region: string; country: string; } }) {
  return (
    <Card>
      <CardHeader><CardTitle>Location</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="text-sm text-muted-foreground">Region</div>
          <div className="font-medium">{course.region}</div>
          <div className="text-sm text-muted-foreground mt-3">Country</div>
          <div className="font-medium">{course.country}</div>
        </div>
        <div className="h-28 w-36 overflow-hidden rounded-lg bg-muted">
          {/* TODO: mini map thumbnail; onClick -> open full map */}
        </div>
      </CardContent>
    </Card>
  );
}