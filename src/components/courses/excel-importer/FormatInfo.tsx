
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const FormatInfo = () => {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">File Format Requirements</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>Supported formats:</strong> CSV (.csv) and Text (.txt) files only</p>
              <p><strong>Excel files:</strong> Please export as CSV format first</p>
              <p><strong>Required columns:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Name:</strong> Course name (required)</li>
                <li><strong>Country:</strong> Country name (required)</li>
                <li><strong>Region:</strong> State/province (optional)</li>
                <li><strong>Global Rank:</strong> World ranking (optional)</li>
                <li><strong>Regional Rank:</strong> GB&I ranking (optional)</li>
                <li><strong>USA Rank:</strong> US ranking (optional)</li>
                <li><strong>Description:</strong> Course details (optional)</li>
                <li><strong>Latitude/Longitude:</strong> GPS coordinates (optional)</li>
                <li><strong>Website:</strong> Course website URL (optional)</li>
              </ul>
              <p><strong>Note:</strong> Column names are flexible - the system will automatically detect variations</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormatInfo;
