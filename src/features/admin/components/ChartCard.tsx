import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { exportCSV } from '../utils/exportCSV';

export const ChartCard: React.FC<React.PropsWithChildren<{
  title: string;
  className?: string;
  data?: any[];
  fileName?: string;
}>> = ({ title, className, data, fileName = title.replace(/\s+/g, '_').toLowerCase(), children }) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {data && data.length > 0 && (
          <button
            onClick={() => exportCSV(fileName, data)}
            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
            title="Export CSV"
            aria-label="Export CSV"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);
