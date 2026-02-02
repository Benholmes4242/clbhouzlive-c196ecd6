import React from 'react';
import { Loader2 } from 'lucide-react';

interface MediaPickerLoadingProps {
  message?: string;
}

export function MediaPickerLoading({ message = 'Loading your media...' }: MediaPickerLoadingProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background min-h-[300px] animate-in fade-in duration-200">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/20 animate-ping" />
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        {message}
      </p>
    </div>
  );
}
