import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { parseExcelFile } from './excel-importer/csvUtils';
import { ExcelCourseData, ImportResult, DebugInfo } from './excel-importer/types';
import DataPreview from './excel-importer/DataPreview';
import ImportProgress from './excel-importer/ImportProgress';
import ImportResults from './excel-importer/ImportResults';
import DebugInfoComponent from './excel-importer/DebugInfo';
import ErrorDisplay from './excel-importer/ErrorDisplay';
import { 
  EnhancedFileUpload, 
  DuplicateHandlingOptions,
  ImportHistoryTable,
  type DuplicateHandling,
  type ImportHistoryEntry 
} from '@/components/admin/course-import';

const EnhancedExcelCourseImporter = () => {
  
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelCourseData[]>([]);
  const [allData, setAllData] = useState<ExcelCourseData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    rowCount: number;
    errors: string[];
  } | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>('skip');
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);

  const importMutation = useMutation({
    mutationFn: async (coursesData: ExcelCourseData[]) => {
      console.log('Starting Excel import of courses:', coursesData.length);
      
      const insertedCourses = [];
      const skippedCourses = [];
      const updatedCourses = [];
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

          if (existingCourse) {
            if (duplicateHandling === 'skip') {
              skippedCourses.push(existingCourse);
              console.log('Course already exists, skipping:', course.name);
            } else if (duplicateHandling === 'update') {
              const { data, error } = await supabase
                .from('golf_courses')
                .update(course)
                .eq('id', existingCourse.id)
                .select()
                .single();

              if (error) {
                console.error('Error updating course:', course.name, error);
                errors.push({ course: course.name, error: error.message });
              } else {
                updatedCourses.push(data);
                console.log('Updated course:', course.name);
              }
            } else {
              // create - insert even if duplicate
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
                console.log('Inserted course (duplicate allowed):', course.name);
              }
            }
          } else {
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
              console.log('Inserted course:', course.name);
            }
          }
        } catch (error: any) {
          console.error('Error processing course:', course.name, error);
          errors.push({ course: course.name, error: error.message });
        }
      }

      return {
        totalCourses: coursesData.length,
        insertedCourses: insertedCourses.length,
        updatedCourses: updatedCourses.length,
        skippedCourses: skippedCourses.length,
        errors: errors.length,
        inserted: insertedCourses,
        updated: updatedCourses,
        skipped: skippedCourses,
        errorDetails: errors
      };
    },
    onSuccess: (data) => {
      console.log('Excel import successful:', data);
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-import-stats'] });
      
      // Add to history
      const historyEntry: ImportHistoryEntry = {
        id: Date.now().toString(),
        fileName: file?.name || 'Unknown',
        date: new Date(),
        totalRecords: data.totalCourses,
        successCount: data.insertedCourses + (data.updatedCourses || 0),
        failedCount: data.errors,
        skippedCount: data.skippedCourses,
        status: data.errors > 0 ? (data.insertedCourses > 0 ? 'partial' : 'failed') : 'completed',
      };
      setImportHistory(prev => [historyEntry, ...prev]);
      
      toast.success("Import complete", { description: `${data.insertedCourses} added${data.updatedCourses ? `, ${data.updatedCourses} updated` : ''}, ${data.skippedCourses} skipped${data.errors > 0 ? `, ${data.errors} errors` : ''}` });
      setProgress(100);
      setShowPreview(false);
    },
    onError: (error) => {
      console.error('Excel import failed:', error);
      toast.error("Import Failed", { description: "Failed to import golf courses from Excel file. Please check the format and try again." });
      setProgress(0);
    },
  });

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    console.log('File selected:', selectedFile);
    
    setFile(selectedFile);
    setImportResult(null);
    setProgress(0);
    setParseError(null);
    setShowPreview(false);
    setDebugInfo(null);
    setValidationResult(null);
    setIsValidating(true);
    
    toast.success("File Selected", { description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` });

    try {
      const { data: coursesData, debug } = await parseExcelFile(selectedFile);
      setPreviewData(coursesData.slice(0, 10));
      setAllData(coursesData);
      setDebugInfo(debug);
      setValidationResult({
        isValid: true,
        rowCount: coursesData.length,
        errors: [],
      });
    } catch (error) {
      console.error('Error parsing file for preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setParseError(errorMessage);
      setValidationResult({
        isValid: false,
        rowCount: 0,
        errors: [errorMessage],
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setAllData([]);
    setShowPreview(false);
    setImportResult(null);
    setProgress(0);
    setParseError(null);
    setDebugInfo(null);
    setValidationResult(null);
  }, []);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (!file || allData.length === 0) {
      toast.error("No File Selected", { description: "Please select a valid CSV file first." });
      return;
    }

    console.log('Starting import process with', allData.length, 'courses');
    importMutation.mutate(allData);
  };

  return (
    <div className="space-y-6">
      <EnhancedFileUpload
        file={file}
        onFileSelect={handleFileSelect}
        onClear={handleClear}
        isValidating={isValidating}
        validationResult={validationResult}
      />

      {file && validationResult?.isValid && (
        <DuplicateHandlingOptions
          value={duplicateHandling}
          onChange={setDuplicateHandling}
        />
      )}
      
      {file && previewData.length > 0 && !showPreview && (
        <Button
          onClick={handlePreview}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Data ({previewData.length} of {allData.length} rows shown)
        </Button>
      )}

      <DataPreview previewData={previewData} showPreview={showPreview} />
      
      {file && validationResult?.isValid && (
        <Button
          onClick={handleImport}
          disabled={importMutation.isPending}
          className="w-full"
          size="lg"
        >
          <Upload className="h-4 w-4 mr-2" />
          {importMutation.isPending ? 'Importing...' : `Import ${allData.length} Courses`}
        </Button>
      )}

      <DebugInfoComponent debugInfo={debugInfo} />
      <ErrorDisplay parseError={parseError} />
      <ImportProgress progress={progress} isImporting={importMutation.isPending} />
      <ImportResults importResult={importResult} />
      
      <ImportHistoryTable history={importHistory} />
    </div>
  );
};

export default EnhancedExcelCourseImporter;
