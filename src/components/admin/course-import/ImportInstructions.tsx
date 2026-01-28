import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ImportInstructions = () => {
  const [isOpen, setIsOpen] = React.useState(true);

  const requiredColumns = [
    { name: 'name', description: 'Course name (e.g., "Augusta National Golf Club")', required: true },
    { name: 'country', description: 'Country name (e.g., "USA", "United Kingdom")', required: true },
  ];

  const optionalColumns = [
    { name: 'region', description: 'State, province, or region (e.g., "Georgia", "Scotland")' },
    { name: 'latitude', description: 'GPS latitude coordinate (e.g., 33.5026)' },
    { name: 'longitude', description: 'GPS longitude coordinate (e.g., -82.0224)' },
    { name: 'website_url', description: 'Course website URL' },
    { name: 'global_rank', description: 'World ranking position (number)' },
    { name: 'usa_rank', description: 'US ranking position (number)' },
    { name: 'regional_rank', description: 'Regional ranking position (number)' },
    { name: 'description', description: 'Course description or notes' },
    { name: 'thumbnail', description: 'URL to course image' },
  ];

  const commonErrors = [
    { error: 'Name column not found', fix: 'Ensure your file has a column named "name", "course", or "course_name"' },
    { error: 'Country column not found', fix: 'Ensure your file has a column named "country", "nation", or "location"' },
    { error: 'No valid courses found', fix: 'Check that rows have values in both name and country columns' },
    { error: 'Excel files not supported', fix: 'Export your Excel file as CSV format first (File → Save As → CSV)' },
  ];

  const handleDownloadTemplate = () => {
    const headers = ['name', 'country', 'region', 'latitude', 'longitude', 'website_url', 'global_rank', 'description'];
    const exampleRows = [
      ['Augusta National Golf Club', 'USA', 'Georgia', '33.5026', '-82.0224', 'https://www.augustanational.com', '1', 'Home of the Masters'],
      ['St Andrews Links (Old Course)', 'United Kingdom', 'Scotland', '56.3433', '-2.8024', 'https://www.standrews.com', '2', 'The Home of Golf'],
      ['Royal Melbourne Golf Club', 'Australia', 'Victoria', '-37.8951', '145.0539', 'https://www.royalmelbourne.com.au', '6', 'Premier Australian course'],
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'golf_courses_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Import Instructions</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Step by step guide */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">How to Import Courses</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Prepare your CSV file with the required columns (see below)</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Click the upload area or drag and drop your file</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Preview the data to verify it was parsed correctly</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <span>Click "Import Courses" to add them to the database</span>
                </li>
              </ol>
            </div>

            {/* Download template */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">Download Template</p>
                <p className="text-xs text-muted-foreground">Pre-formatted CSV with example data</p>
              </div>
              <Button size="sm" onClick={handleDownloadTemplate}>
                Download CSV
              </Button>
            </div>

            {/* Required columns */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Required Columns
              </h4>
              <div className="grid gap-2">
                {requiredColumns.map((col) => (
                  <div key={col.name} className="flex items-start gap-2 text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <code className="bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded text-xs font-mono">{col.name}</code>
                    <span className="text-muted-foreground">{col.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional columns */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Optional Columns
              </h4>
              <div className="grid gap-1.5">
                {optionalColumns.map((col) => (
                  <div key={col.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{col.name}</code>
                    <span className="text-muted-foreground text-xs">{col.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common errors */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Common Errors & Fixes
              </h4>
              <div className="space-y-2">
                {commonErrors.map((item, index) => (
                  <div key={index} className="text-sm p-2 bg-amber-50 dark:bg-amber-950/20 rounded space-y-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">{item.error}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">→ {item.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ImportInstructions;
