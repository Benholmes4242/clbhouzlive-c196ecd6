
import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ file, onFileSelect }) => {
  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={onFileSelect}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">
            {file ? `Selected: ${file.name}` : 'Click to select CSV file'}
          </span>
          <span className="text-xs text-muted-foreground">
            Accepts .csv and .txt files only
          </span>
        </label>
      </div>
      
      {file && (
        <div className="text-sm text-muted-foreground text-center">
          File size: {(file.size / 1024).toFixed(1)} KB
        </div>
      )}
    </div>
  );
};

export default FileUpload;
