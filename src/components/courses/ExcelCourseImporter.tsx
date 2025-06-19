
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
  const [parseError, setParseError] = useState<string | null>(null);

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseExcelFile = async (file: File): Promise<ExcelCourseData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('Starting to parse file:', file.name);
          const text = e.target?.result as string;
          
          if (!text || text.trim().length === 0) {
            throw new Error('File is empty or could not be read');
          }
          
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          console.log('Total lines found:', lines.length);
          
          if (lines.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }
          
          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
          console.log('Headers found:', headers);
          
          const courses: ExcelCourseData[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            console.log(`Processing row ${i}:`, values);
            
            if (values.length < 2) {
              console.log(`Skipping row ${i}: insufficient columns`);
              continue;
            }
            
            const nameIndex = headers.findIndex(h => h.includes('name'));
            const countryIndex = headers.findIndex(h => h.includes('country'));
            const regionIndex = headers.findIndex(h => h.includes('region'));
            const continentIndex = headers.findIndex(h => h.includes('continent'));
            const globalRankIndex = headers.findIndex(h => h.includes('global') && h.includes('rank'));
            const regionalRankIndex = headers.findIndex(h => h.includes('regional') && h.includes('rank'));
            const usaRankIndex = headers.findIndex(h => h.includes('usa') && h.includes('rank'));
            const descriptionIndex = headers.findIndex(h => h.includes('description'));
            const latitudeIndex = headers.findIndex(h => h.includes('latitude') || h.includes('lat'));
            const longitudeIndex = headers.findIndex(h => h.includes('longitude') || h.includes('lng') || h.includes('lon'));
            const thumbnailIndex = headers.findIndex(h => h.includes('thumbnail') || h.includes('image'));
            
            const name = nameIndex >= 0 ? values[nameIndex]?.replace(/"/g, '') : '';
            const country = countryIndex >= 0 ? values[countryIndex]?.replace(/"/g, '') : '';
            
            if (!name || !country) {
              console.log(`Skipping row ${i}: missing name or country`);
              continue;
            }
            
            const course: ExcelCourseData = {
              name,
              country,
              region: regionIndex >= 0 ? values[regionIndex]?.replace(/"/g, '') || '' : '',
              continent: (continentIndex >= 0 ? values[continentIndex]?.replace(/"/g, '') || 'Europe' : 'Europe') as Continent,
              global_rank: globalRankIndex >= 0 && values[globalRankIndex] ? parseInt(values[globalRankIndex]) : undefined,
              regional_rank: regionalRankIndex >= 0 && values[regionalRankIndex] ? parseInt(values[regionalRankIndex]) : undefined,
              usa_rank: usaRankIndex >= 0 && values[usaRankIndex] ? parseInt(values[usaRankIndex]) : undefined,
              description: descriptionIndex >= 0 ? values[descriptionIndex]?.replace(/"/g, '') || '' : '',
              latitude: latitudeIndex >= 0 && values[latitudeIndex] ? parseFloat(values[latitudeIndex]) : undefined,
              longitude: longitudeIndex >= 0 && values[longitudeIndex] ? parseFloat(values[longitudeIndex]) : undefined,
              thumbnail_image: thumbnailIndex >= 0 ? values[thumbnailIndex]?.replace(/"/g, '') || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop' : 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
            };
            
            courses.push(course);
            console.log('Added course:', course.name);
          }
          
          console.log('Parsed courses:', courses.length);
          resolve(courses);
        } catch (error) {
          console.error('Parse error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
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
    console.log('File selected:', selectedFile);
    
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setProgress(0);
      setParseError(null);
      
      // Show file info
      toast({
        title: "File Selected",
        description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting import process with file:', file.name);
    setParseError(null);

    try {
      const coursesData = await parseExcelFile(file);
      console.log('Parsed data:', coursesData);
      
      if (coursesData.length === 0) {
        setParseError("No valid course data found in the file. Please check the format.");
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setParseError(errorMessage);
      toast({
        title: "File Parse Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Courses from CSV
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with golf course data
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? `Selected: ${file.name}` : 'Click to select CSV file'}
              </span>
              <span className="text-xs text-muted-foreground">
                Accepts .csv, .txt files
              </span>
            </label>
          </div>
          
          {file && (
            <div className="text-sm text-muted-foreground text-center">
              File size: {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
          
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

        {/* Parse Error */}
        {parseError && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Parse Error</h4>
                  <p className="text-sm text-red-800 dark:text-red-200">{parseError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Expected CSV Format</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your CSV file should have these columns: name, country, region, continent, 
                  global_rank, regional_rank, usa_rank, description, latitude, longitude, thumbnail_image
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  The first row should contain column headers. Values can be quoted with double quotes.
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
