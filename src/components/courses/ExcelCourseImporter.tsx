import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { parseExcelFile } from './excel-importer/csvUtils';
import { ExcelCourseData, ImportResult, DebugInfo } from './excel-importer/types';
import FileUpload from './excel-importer/FileUpload';
import DataPreview from './excel-importer/DataPreview';
import ImportProgress from './excel-importer/ImportProgress';
import ImportResults from './excel-importer/ImportResults';
import DebugInfoComponent from './excel-importer/DebugInfo';
import ErrorDisplay from './excel-importer/ErrorDisplay';
import FormatInfo from './excel-importer/FormatInfo';

const ExcelCourseImporter = () => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelCourseData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const importMutation = useMutation({
    mutationFn: async (coursesData: ExcelCourseData[]) => {
      console.log('Starting Excel import of courses:', coursesData.length);
      
      const insertedCourses = [];
      const skippedCourses = [];
      const errors = [];

      for (let i = 0; i < coursesData.length; i++) {
        const course = coursesData[i];
        setProgress(((i + 1) / coursesData.length) * 100);
        
        try {
          const { data: existingCourse } = await supabase
            .from('golf_courses')
            .select('id, name')
            .eq('name', course.name)
            .eq('country', course.country)
            .maybeSingle();

          if (!existingCourse) {
            const { data, error } = await supabase
              .from('golf_courses')
              .insert([course])
              .select()
              .single();

            if (error) {
              console.error('Error inserting course:', course.name, error);
              errors.push({ course: course.name, error: error.message });
            } else {
              insertedCourses.push(data);
            }
          } else {
            skippedCourses.push(existingCourse);
          }
        } catch (error) {
          console.error('Error processing course:', course.name, error);
          errors.push({ course: course.name, error: error.message });
        }
      }

      return {
        totalCourses: coursesData.length,
        insertedCourses: insertedCourses.length,
        skippedCourses: skippedCourses.length,
        errors: errors.length,
        inserted: insertedCourses,
        skipped: skippedCourses,
        errorDetails: errors
      };
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success("Import Complete", {
        description: `Added ${data.insertedCourses} new courses, skipped ${data.skippedCourses} duplicates${data.errors > 0 ? `, ${data.errors} errors` : ''}.`,
      });
      setProgress(100);
      setShowPreview(false);
    },
    onError: (error) => {
      console.error('Excel import failed:', error);
      toast.error("Import Failed", {
        description: "Failed to import golf courses from Excel file. Please check the format and try again.",
      });
      setProgress(0);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setProgress(0);
      setParseError(null);
      setShowPreview(false);
      setDebugInfo(null);
      
      toast.success("File Selected", {
        description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
      });

      try {
        const { data: coursesData, debug } = await parseExcelFile(selectedFile);
        setPreviewData(coursesData.slice(0, 5));
        setDebugInfo(debug);
      } catch (error) {
        console.error('Error parsing file for preview:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setParseError(errorMessage);
      }
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("No File Selected", {
        description: "Please select a CSV file first.",
      });
      return;
    }

    setParseError(null);
    try {
      const { data: coursesData } = await parseExcelFile(file);
      if (coursesData.length === 0) {
        setParseError("No valid course data found in the file. Please check the format.");
        toast.error("No Data Found", {
          description: "No valid course data found in the file.",
        });
        return;
      }
      importMutation.mutate(coursesData);
    } catch (error) {
      console.error('Error parsing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setParseError(errorMessage);
      toast.error("File Parse Error", { description: errorMessage });
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload file={file} onFileSelect={handleFileSelect} />
      
      {file && previewData.length > 0 && !showPreview && (
        <Button
          onClick={handlePreview}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Data ({previewData.length} rows shown)
        </Button>
      )}

      <DataPreview previewData={previewData} showPreview={showPreview} />
      
      {file && (
        <Button
          onClick={handleImport}
          disabled={importMutation.isPending}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {importMutation.isPending ? 'Importing...' : 'Import Courses'}
        </Button>
      )}

      <DebugInfoComponent debugInfo={debugInfo} />
      <ErrorDisplay parseError={parseError} />
      <ImportProgress progress={progress} isImporting={importMutation.isPending} />
      <ImportResults importResult={importResult} />
      <FormatInfo />
    </div>
  );
};

export default ExcelCourseImporter;
