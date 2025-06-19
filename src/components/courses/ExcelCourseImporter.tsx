
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Continent = Database['public']['Enums']['continent'];

interface ExcelCourseData {
  name: string;
  country: string;
  region?: string;
  continent: Continent;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  thumbnail_image?: string;
}

const ExcelCourseImporter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const parseExcelFile = async (file: File): Promise<ExcelCourseData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // Simple CSV-like parsing - expecting the file to be saved as CSV
          const text = new TextDecoder().decode(data);
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }
          
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const courses: ExcelCourseData[] = [];
          
          // Expected columns: name, country, region, continent, global_rank, regional_rank, usa_rank, description, latitude, longitude, thumbnail_image
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length < 3) continue; // Skip invalid rows
            
            const course: ExcelCourseData = {
              name: values[headers.indexOf('name')] || '',
              country: values[headers.indexOf('country')] || '',
              region: values[headers.indexOf('region')] || '',
              continent: (values[headers.indexOf('continent')] || 'Europe') as Continent,
              global_rank: values[headers.indexOf('global_rank')] ? parseInt(values[headers.indexOf('global_rank')]) : undefined,
              regional_rank: values[headers.indexOf('regional_rank')] ? parseInt(values[headers.indexOf('regional_rank')]) : undefined,
              usa_rank: values[headers.indexOf('usa_rank')] ? parseInt(values[headers.indexOf('usa_rank')]) : undefined,
              description: values[headers.indexOf('description')] || '',
              latitude: values[headers.indexOf('latitude')] ? parseFloat(values[headers.indexOf('latitude')]) : undefined,
              longitude: values[headers.indexOf('longitude')] ? parseFloat(values[headers.indexOf('longitude')]) : undefined,
              thumbnail_image: values[headers.indexOf('thumbnail_image')] || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
            };
            
            if (course.name && course.country) {
              courses.push(course);
            }
          }
          
          resolve(courses);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

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
          // Check if course already exists
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
              console.log('Inserted course:', course.name);
            }
          } else {
            skippedCourses.push(existingCourse);
            console.log('Course already exists:', course.name);
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
      console.log('Excel import successful:', data);
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: "Import Complete!",
        description: `Added ${data.insertedCourses} new courses, skipped ${data.skippedCourses} duplicates${data.errors > 0 ? `, ${data.errors} errors` : ''}.`,
      });
      setProgress(100);
    },
    onError: (error) => {
      console.error('Excel import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import golf courses from Excel file. Please check the format and try again.",
        variant: "destructive",
      });
      setProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const coursesData = await parseExcelFile(file);
      if (coursesData.length === 0) {
        toast({
          title: "No Data Found",
          description: "No valid course data found in the file.",
          variant: "destructive",
        });
        return;
      }
      
      importMutation.mutate(coursesData);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "File Parse Error",
        description: "Could not parse the Excel file. Please ensure it's in the correct format.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Courses from Excel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload an Excel file (saved as CSV) with golf course data
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : 'Click to select Excel file'}
              </span>
              <span className="text-xs text-muted-foreground">
                Accepts .csv, .xlsx, .xls files
              </span>
            </label>
          </div>
          
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
        </div>

        {/* Progress */}
        {importMutation.isPending && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing courses... {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Results */}
        {importResult && (
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
        )}

        {/* Format Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Expected Format</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your Excel file should have these columns: name, country, region, continent, 
                  global_rank, regional_rank, usa_rank, description, latitude, longitude, thumbnail_image
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Save your Excel file as CSV format for best compatibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ExcelCourseImporter;
