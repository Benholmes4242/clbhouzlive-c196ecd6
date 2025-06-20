
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const FormatInfo: React.FC = () => {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Expected File Format</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your file should have these columns (flexible naming): 
              <strong> name/course/golf_course, country/nation/location, region/state, continent, 
              global_rank/world_rank/rank, regional_rank, usa_rank, description/notes, 
              latitude/lat, longitude/lng, thumbnail/image, website/url</strong>
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              The first row should contain column headers. Only "name" and "country" are required. 
              Continent values must be: North America, South America, Europe, Asia, Africa, or Oceania.
              If continent is not provided, it will be auto-detected from the country name.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormatInfo;
