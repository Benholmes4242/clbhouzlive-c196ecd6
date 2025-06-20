
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExcelCourseData } from './types';

interface DataPreviewProps {
  previewData: ExcelCourseData[];
  showPreview: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ previewData, showPreview }) => {
  if (!showPreview || previewData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing first 5 rows. Review before importing.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Name</th>
                <th className="border border-border p-2 text-left">Country</th>
                <th className="border border-border p-2 text-left">Region</th>
                <th className="border border-border p-2 text-left">Continent</th>
                <th className="border border-border p-2 text-left">Global Rank</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((course, index) => (
                <tr key={index}>
                  <td className="border border-border p-2">{course.name}</td>
                  <td className="border border-border p-2">{course.country}</td>
                  <td className="border border-border p-2">{course.region || '-'}</td>
                  <td className="border border-border p-2">{course.continent}</td>
                  <td className="border border-border p-2">{course.global_rank || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
