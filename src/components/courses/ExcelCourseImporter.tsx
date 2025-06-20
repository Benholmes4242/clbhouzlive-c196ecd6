import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, AlertCircle, FileSpreadsheet, Eye } from 'lucide-react';
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
  website_url?: string;
}

const ExcelCourseImporter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelCourseData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

  const normalizeHeader = (header: string): string => {
    return header.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const findColumnIndex = (headers: string[], patterns: string[]): number => {
    return headers.findIndex(header => 
      patterns.some(pattern => header.includes(pattern))
    );
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
          
          // Split by different line endings and filter empty lines
          const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
          console.log('Total lines found:', lines.length);
          
          if (lines.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }
          
          // Parse and normalize headers
          const rawHeaders = parseCSVLine(lines[0]);
          const headers = rawHeaders.map(normalizeHeader);
          
          console.log('Raw headers:', rawHeaders);
          console.log('Normalized headers:', headers);
          
          // More flexible column mapping
          const nameIndex = findColumnIndex(headers, ['name', 'course', 'golf_course', 'course_name']);
          const countryIndex = findColumnIndex(headers, ['country', 'nation', 'location']);
          const regionIndex = findColumnIndex(headers, ['region', 'state', 'province', 'area']);
          const continentIndex = findColumnIndex(headers, ['continent']);
          const globalRankIndex = findColumnIndex(headers, ['global_rank', 'world_rank', 'rank', 'global', 'world']);
          const regionalRankIndex = findColumnIndex(headers, ['regional_rank', 'region_rank']);
          const usaRankIndex = findColumnIndex(headers, ['usa_rank', 'us_rank', 'america_rank']);
          const descriptionIndex = findColumnIndex(headers, ['description', 'notes', 'details']);
          const latitudeIndex = findColumnIndex(headers, ['latitude', 'lat']);
          const longitudeIndex = findColumnIndex(headers, ['longitude', 'lng', 'lon', 'long']);
          const thumbnailIndex = findColumnIndex(headers, ['thumbnail', 'image', 'photo', 'picture']);
          const websiteIndex = findColumnIndex(headers, ['website', 'url', 'link', 'web']);
          
          const debug = {
            totalLines: lines.length,
            headers: rawHeaders,
            normalizedHeaders: headers,
            columnMapping: {
              name: nameIndex,
              country: countryIndex,
              region: regionIndex,
              continent: continentIndex,
              globalRank: globalRankIndex,
              regionalRank: regionalRankIndex,
              usaRank: usaRankIndex,
              description: descriptionIndex,
              latitude: latitudeIndex,
              longitude: longitudeIndex,
              thumbnail: thumbnailIndex,
              website: websiteIndex
            }
          };
          
          setDebugInfo(debug);
          console.log('Column mapping:', debug.columnMapping);
          
          if (nameIndex === -1) {
            throw new Error(`Name column not found. Available columns: ${rawHeaders.join(', ')}. Expected columns with names like: name, course, golf_course, course_name`);
          }
          
          if (countryIndex === -1) {
            throw new Error(`Country column not found. Available columns: ${rawHeaders.join(', ')}. Expected columns with names like: country, nation, location`);
          }
          
          const courses: ExcelCourseData[] = [];
          const validContinents: Continent[] = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
          const skippedRows = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            console.log(`Processing row ${i}:`, values);
            
            if (values.length < Math.max(nameIndex + 1, countryIndex + 1)) {
              console.log(`Skipping row ${i}: insufficient columns`);
              skippedRows.push({ row: i, reason: 'insufficient columns', values });
              continue;
            }
            
            const name = values[nameIndex]?.replace(/"/g, '').trim();
            const country = values[countryIndex]?.replace(/"/g, '').trim();
            
            if (!name || !country) {
              console.log(`Skipping row ${i}: missing name or country`);
              skippedRows.push({ row: i, reason: 'missing name or country', name, country });
              continue;
            }
            
            // Handle continent with validation and smart defaults
            let continent: Continent = 'Europe'; // default
            if (continentIndex >= 0 && values[continentIndex]) {
              const continentValue = values[continentIndex]?.replace(/"/g, '').trim();
              if (validContinents.includes(continentValue as Continent)) {
                continent = continentValue as Continent;
              }
            } else {
              // Smart continent detection based on country
              const countryLower = country.toLowerCase();
              if (countryLower.includes('usa') || countryLower.includes('united states') || countryLower.includes('america') || countryLower.includes('canada')) {
                continent = 'North America';
              } else if (countryLower.includes('australia') || countryLower.includes('new zealand')) {
                continent = 'Oceania';
              } else if (countryLower.includes('japan') || countryLower.includes('china') || countryLower.includes('korea') || countryLower.includes('singapore')) {
                continent = 'Asia';
              } else if (countryLower.includes('south africa') || countryLower.includes('egypt') || countryLower.includes('morocco')) {
                continent = 'Africa';
              }
            }
            
            const course: ExcelCourseData = {
              name,
              country,
              region: regionIndex >= 0 ? values[regionIndex]?.replace(/"/g, '').trim() || '' : '',
              continent,
              global_rank: globalRankIndex >= 0 && values[globalRankIndex] ? 
                parseInt(values[globalRankIndex]) || undefined : undefined,
              regional_rank: regionalRankIndex >= 0 && values[regionalRankIndex] ? 
                parseInt(values[regionalRankIndex]) || undefined : undefined,
              usa_rank: usaRankIndex >= 0 && values[usaRankIndex] ? 
                parseInt(values[usaRankIndex]) || undefined : undefined,
              description: descriptionIndex >= 0 ? 
                values[descriptionIndex]?.replace(/"/g, '').trim() || '' : '',
              latitude: latitudeIndex >= 0 && values[latitudeIndex] ? 
                parseFloat(values[latitudeIndex]) || undefined : undefined,
              longitude: longitudeIndex >= 0 && values[longitudeIndex] ? 
                parseFloat(values[longitudeIndex]) || undefined : undefined,
              thumbnail_image: thumbnailIndex >= 0 && values[thumbnailIndex] ? 
                values[thumbnailIndex]?.replace(/"/g, '').trim() || 
                'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop' : 
                'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
              website_url: websiteIndex >= 0 ? 
                values[websiteIndex]?.replace(/"/g, '').trim() || undefined : undefined
            };
            
            courses.push(course);
            console.log('Added course:', course.name);
          }
          
          console.log('Parsed courses:', courses.length);
          console.log('Skipped rows:', skippedRows.length);
          
          if (courses.length === 0) {
            throw new Error(`No valid courses found. Debug info: ${JSON.stringify({ skippedRows, debug }, null, 2)}`);
          }
          
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
      setShowPreview(false);
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    console.log('File selected:', selectedFile);
    
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setProgress(0);
      setParseError(null);
      setShowPreview(false);
      setDebugInfo(null);
      
      // Show file info and parse for preview
      toast({
        title: "File Selected",
        description: `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
      });

      try {
        const coursesData = await parseExcelFile(selectedFile);
        setPreviewData(coursesData.slice(0, 5)); // Show first 5 rows for preview
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
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
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
              {file ? `Selected: ${file.name}` : 'Click to select Excel/CSV file'}
            </span>
            <span className="text-xs text-muted-foreground">
              Accepts .csv, .xlsx, .xls, .txt files
            </span>
          </label>
        </div>
        
        {file && (
          <div className="text-sm text-muted-foreground text-center">
            File size: {(file.size / 1024).toFixed(1)} KB
          </div>
        )}
        
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

        {showPreview && previewData.length > 0 && (
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

      {/* Debug Info */}
      {debugInfo && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Debug Information</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• Total lines: {debugInfo.totalLines}</p>
                  <p>• Headers found: {debugInfo.headers.join(', ')}</p>
                  <p>• Column mapping: {JSON.stringify(debugInfo.columnMapping, null, 2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};

export default ExcelCourseImporter;
