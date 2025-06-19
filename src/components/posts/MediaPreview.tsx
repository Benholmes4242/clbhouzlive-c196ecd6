
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  mediaFiles: File[];
  onRemoveFile: (index: number) => void;
}

const MediaPreview = ({ mediaFiles, onRemoveFile }: MediaPreviewProps) => {
  if (mediaFiles.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Selected Files:</Label>
      <div className="space-y-2">
        {mediaFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPreview;
