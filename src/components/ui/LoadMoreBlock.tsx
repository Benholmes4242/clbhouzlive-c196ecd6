import React from 'react';
import { Button } from '@/components/ui/button';

interface LoadMoreBlockProps {
  buttonLabel: string;
  caption: string;
  onClick: () => void;
  disabled?: boolean;
}

export const LoadMoreBlock: React.FC<LoadMoreBlockProps> = ({
  buttonLabel,
  caption,
  onClick,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <Button
        variant="secondary"
        onClick={onClick}
        disabled={disabled}
        className="h-11 px-6 rounded-full shadow-sm"
      >
        {buttonLabel}
      </Button>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  );
};

export default LoadMoreBlock;
