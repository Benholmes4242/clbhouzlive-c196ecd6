import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

interface SelectModeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function SelectModeButton({ onClick, disabled, className }: SelectModeButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <CheckSquare className="h-4 w-4 mr-1.5" />
      Select
    </Button>
  );
}
