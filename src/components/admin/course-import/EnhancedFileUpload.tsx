import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedFileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  isValidating?: boolean;
  validationResult?: {
    isValid: boolean;
    rowCount: number;
    errors: string[];
  } | null;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  file,
  onFileSelect,
  onClear,
  isValidating = false,
  validationResult,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const extension = droppedFile.name.toLowerCase().split('.').pop();
      if (extension === 'csv' || extension === 'txt') {
        onFileSelect(droppedFile);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            file && 'border-solid'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    'p-4 rounded-full transition-colors',
                    isDragActive ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Upload className={cn(
                      'h-8 w-8 transition-colors',
                      isDragActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isDragActive ? 'Drop your file here' : 'Drag and drop or click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Accepts CSV and TXT files only
                    </p>
                  </div>
                </div>
              </label>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isValidating && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm">Validating file...</span>
                </div>
              )}

              {validationResult && !isValidating && (
                <div className={cn(
                  'flex items-start gap-2 p-3 rounded-lg text-sm',
                  validationResult.isValid
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                )}>
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    {validationResult.isValid ? (
                      <p>File validated successfully. Found <strong>{validationResult.rowCount}</strong> courses to import.</p>
                    ) : (
                      <div>
                        <p className="font-medium">Validation failed:</p>
                        <ul className="list-disc list-inside mt-1">
                          {validationResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedFileUpload;
