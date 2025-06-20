
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressProps {
  progress: number;
  isImporting: boolean;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ progress, isImporting }) => {
  if (!isImporting) return null;

  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground text-center">
        Processing courses... {Math.round(progress)}%
      </p>
    </div>
  );
};

export default ImportProgress;
