
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { ImportResult } from './types';

interface ImportResultsProps {
  importResult: ImportResult | null;
}

const ImportResults: React.FC<ImportResultsProps> = ({ importResult }) => {
  if (!importResult) return null;

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold">Import Results</h4>
            <div className="space-y-1 text-sm">
              <p>• Total courses processed: <strong>{importResult.totalCourses}</strong></p>
              <p>• New courses added: <strong>{importResult.insertedCourses}</strong></p>
              <p>• Duplicates skipped: <strong>{importResult.skippedCourses}</strong></p>
              {importResult.errors > 0 && (
                <p className="text-red-600">• Errors: <strong>{importResult.errors}</strong></p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportResults;
