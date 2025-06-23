
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { X, ArrowLeft } from 'lucide-react';

interface DialogNavigationProps {
  showGallery: boolean;
  isSubmitting: boolean;
  canProceedFromGallery: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onBackToGallery: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const DialogNavigation = ({
  showGallery,
  isSubmitting,
  canProceedFromGallery,
  canSubmit,
  onClose,
  onBackToGallery,
  onNext,
  onSubmit
}: DialogNavigationProps) => {
  if (showGallery) {
    return (
      <div className="flex items-center justify-between p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X className="h-5 w-5" />
        </Button>
        <DialogTitle className="text-lg font-semibold">New post</DialogTitle>
        <Button 
          variant="ghost" 
          onClick={onNext}
          disabled={!canProceedFromGallery || isSubmitting}
          className="text-blue-500 font-semibold disabled:text-gray-400"
        >
          Next
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onBackToGallery}
        disabled={isSubmitting}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <DialogTitle className="text-lg font-semibold">New post</DialogTitle>
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting || !canSubmit}
        className="text-blue-500 font-semibold disabled:text-gray-400"
        variant="ghost"
      >
        {isSubmitting ? 'Sharing...' : 'Share'}
      </Button>
    </div>
  );
};

export default DialogNavigation;
