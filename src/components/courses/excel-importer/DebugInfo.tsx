
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { DebugInfo as DebugInfoType } from './types';

interface DebugInfoProps {
  debugInfo: DebugInfoType | null;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ debugInfo }) => {
  if (!debugInfo) return null;

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Debug Information</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• Total lines: {debugInfo.totalLines}</p>
              <p>• Headers found: {debugInfo.headers.join(', ')}</p>
              <p>• Column mapping: {JSON.stringify(debugInfo.columnMapping, null, 2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo;
