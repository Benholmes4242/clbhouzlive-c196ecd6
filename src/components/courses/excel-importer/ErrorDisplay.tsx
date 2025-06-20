
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  parseError: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ parseError }) => {
  if (!parseError) return null;

  return (
    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-red-900 dark:text-red-100">Parse Error</h4>
            <p className="text-sm text-red-800 dark:text-red-200">{parseError}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
