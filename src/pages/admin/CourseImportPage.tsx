import { 
  CourseImportHeader, 
  ImportInstructions 
} from "@/components/admin/course-import";
import EnhancedExcelCourseImporter from "@/components/courses/EnhancedExcelCourseImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export function CourseImportPage() {
  return (
    <div className="space-y-6">
      <CourseImportHeader />
      
      <ImportInstructions />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload & Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedExcelCourseImporter />
        </CardContent>
      </Card>
    </div>
  );
}
