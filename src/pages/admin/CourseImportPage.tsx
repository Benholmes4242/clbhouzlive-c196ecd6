import ExcelCourseImporter from "@/components/courses/ExcelCourseImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export function CourseImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-2">Course Import</h2>
        <p className="text-muted-foreground">Upload and import golf course data from Excel/CSV files</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Golf Course Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelCourseImporter />
        </CardContent>
      </Card>
    </div>
  );
}
