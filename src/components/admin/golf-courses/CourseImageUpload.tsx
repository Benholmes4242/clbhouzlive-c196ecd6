
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';

interface CourseImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  disabled = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please upload a JPG, PNG, or WebP image" });
    }

    setIsUploading(true);

    try {
      // Create a unique filename for golf course images
      const fileExt = file.name.split('.').pop();
      const fileName = `courses/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file to R2 golf courses bucket:', fileName);

      // Upload file to Cloudflare R2 using course-images bucket
      const result = await uploadToCloudflareR2(file, 'clbhouz-course-images', fileName);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('File uploaded successfully to R2:', result.publicUrl);

      setPreviewUrl(result.publicUrl!);
      onImageChange(result.publicUrl!);

      toast.success("Image uploaded");
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error("Upload failed", { description: `Failed to upload image: ${error.message}` });
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    console.log('Removing image');
    setPreviewUrl(null);
    onImageChange(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Update preview URL when currentImageUrl changes
  React.useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  return (
    <div className="space-y-3">
      <Label>Course Image</Label>
      
      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Course preview"
              className="w-full max-w-sm h-48 object-cover rounded-lg border"
              onError={(e) => {
                console.error('Image failed to load:', previewUrl);
                // If image fails to load, show placeholder
                e.currentTarget.style.display = 'none';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Upload a course image (JPG, PNG, or WebP, no size limit)
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading || disabled}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading || disabled}
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {previewUrl ? 'Change Image' : 'Upload Image'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CourseImageUpload;
