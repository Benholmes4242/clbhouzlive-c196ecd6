import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ChartCard: React.FC<React.PropsWithChildren<{ title: string; className?: string }>> = ({ title, className, children }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);
