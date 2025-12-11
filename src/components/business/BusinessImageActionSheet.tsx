import React, { useRef } from 'react';
import { Camera, Trash2, X, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface BusinessImageActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'logo' | 'cover';
  hasImage: boolean;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function BusinessImageActionSheet({
  open,
  onOpenChange,
  type,
  hasImage,
  uploading,
  onUpload,
  onRemove,
}: BusinessImageActionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      onOpenChange(false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    await onRemove();
    onOpenChange(false);
  };

  const title = type === 'logo' ? 'Logo' : 'Cover photo';
  const changeLabel = type === 'logo' ? 'Change logo' : 'Change cover photo';
  const removeLabel = type === 'logo' ? 'Remove logo' : 'Remove cover photo';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-center">{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {/* Change option */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-sq-md bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Camera className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : changeLabel}
            </span>
          </button>

          {/* Remove option - only show if has image */}
          {hasImage && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-sq-md bg-muted/50 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-sm font-medium">{removeLabel}</span>
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={() => onOpenChange(false)}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-sq-md bg-muted/30 hover:bg-muted/50 transition-colors mt-2"
          >
            <span className="text-sm font-medium text-muted-foreground">Cancel</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </SheetContent>
    </Sheet>
  );
}
