import React from 'react';
import { Loader2 } from 'lucide-react';

interface MediaPickerLoadingProps {
  message?: string;
}

export function MediaPickerLoading({ message = 'Loading your media...' }: MediaPickerLoadingProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background min-h-[300px]">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
