import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Wand2, Download, RefreshCw } from 'lucide-react';
import { useHeaderExtension } from '@/hooks/useHeaderExtension';
import { useToast } from '@/hooks/use-toast';

interface HeaderExtensionUploadProps {
  onExtendedImageReady?: (extendedImageUrl: string) => void;
}

export const HeaderExtensionUpload: React.FC<HeaderExtensionUploadProps> = ({
  onExtendedImageReady
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extendedImageUrl, setExtendedImageUrl] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [extensionHeight, setExtensionHeight] = useState<number>(200);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { extendHeader, isProcessing, progress } = useHeaderExtension();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtendHeader = async () => {
    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please select an image first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const extendedImage = await extendHeader(selectedFile, extensionHeight, customPrompt || undefined);
      setExtendedImageUrl(extendedImage);
      onExtendedImageReady?.(extendedImage);
    } catch (error) {
      console.error('Error extending header:', error);
    }
  };

  const downloadExtendedImage = () => {
    if (!extendedImageUrl) return;

    const link = document.createElement('a');
    link.href = extendedImageUrl;
    link.download = `extended-header-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setExtendedImageUrl('');
    setCustomPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Header Extension
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload an image and let AI extend it upward for perfect header backgrounds.
          Automatically falls back to stretch+blur if AI processing fails.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Select Image</Label>
          <div className="flex gap-2">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="flex-1"
            />
            {selectedFile && (
              <Button variant="outline" size="sm" onClick={resetUpload}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </p>
          )}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Original Image Preview</Label>
            <div className="relative overflow-hidden rounded-lg border bg-muted max-h-64">
              <img
                src={previewUrl}
                alt="Original"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Extension Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="extension-height">Extension Height (px)</Label>
            <Input
              id="extension-height"
              type="number"
              value={extensionHeight}
              onChange={(e) => setExtensionHeight(parseInt(e.target.value) || 200)}
              min="50"
              max="500"
              step="10"
            />
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label htmlFor="custom-prompt">Custom Extension Prompt (Optional)</Label>
          <Textarea
            id="custom-prompt"
            placeholder="e.g., 'Extend with more blue sky and fluffy clouds' or 'Add more forest canopy and trees'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for automatic background extension. Be specific about what background elements to add.
          </p>
        </div>

        {/* Process Button */}
        <Button
          onClick={handleExtendHeader}
          disabled={!selectedFile || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {progress || 'Processing...'}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Extend Header with AI
            </>
          )}
        </Button>

        {/* Extended Image Result */}
        {extendedImageUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Extended Header Image</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExtendedImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="relative overflow-hidden rounded-lg border bg-muted">
              <img
                src={extendedImageUrl}
                alt="Extended header"
                className="w-full h-auto object-contain"
              />
            </div>
            
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">✨ Processing Complete!</p>
              <p>
                Your header has been extended with seamless blending, feathering, and noise reduction.
                The image is now ready to use as a header background.
              </p>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg space-y-1">
          <p className="font-medium">💡 Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use images with clear, extendable backgrounds (sky, walls, nature)</li>
            <li>Avoid images with complex patterns or text at the top edge</li>
            <li>Minimum size: 512x512px for AI processing</li>
            <li>The system automatically adds feathering and noise reduction</li>
            <li>Fallback method activates automatically if AI processing fails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};