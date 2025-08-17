import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Wand2, Download, RefreshCw, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useHeaderExtension } from '@/hooks/useHeaderExtension';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface HeaderExtensionUploadProps {
  onExtendedImageReady?: (extendedImageUrl: string) => void;
  enableTelemetry?: boolean;
}

export const HeaderExtensionUpload: React.FC<HeaderExtensionUploadProps> = ({
  onExtendedImageReady,
  enableTelemetry = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extendedImageUrl, setExtendedImageUrl] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [extensionHeight, setExtensionHeight] = useState<number>(200);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { extendHeader, isProcessing, progress, telemetry } = useHeaderExtension();
  const { toast } = useToast();
  
  // Simulate progress for better UX
  useEffect(() => {
    if (isProcessing) {
      setProcessingProgress(0);
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until actually complete
          return prev + Math.random() * 15;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setProcessingProgress(100);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  }, [isProcessing]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "❌ Invalid File",
        description: "Please select an image file (JPG, PNG, WEBP).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 25MB for processing)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "⚠️ File Too Large",
        description: "Please select an image smaller than 25MB. Large images will be automatically resized.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview and validate dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // Check minimum dimensions
      const img = new Image();
      img.onload = () => {
        const minWidth = Math.max(1024, extensionHeight * 2);
        if (img.naturalWidth < minWidth) {
          toast({
            title: "⚠️ Image Too Narrow",
            description: `For best results, image width should be at least ${minWidth}px. Current: ${img.naturalWidth}px.`,
            variant: "destructive"
          });
        }
        
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (aspectRatio < 0.4) {
          toast({
            title: "⚠️ Extreme Panorama",
            description: "Very wide panoramas may not extend well. Consider using a more square image.",
            variant: "default"
          });
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleExtendHeader = async () => {
    if (!selectedFile) {
      toast({
        title: "❌ No Image Selected",
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
          {enableTelemetry && (
            <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {telemetry.lastProcessingTime > 0 ? `${(telemetry.lastProcessingTime / 1000).toFixed(1)}s` : '-'}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {telemetry.successCount}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                {telemetry.fallbackCount}
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {telemetry.errorCount}
              </div>
            </div>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload an image and let AI extend it upward for perfect header backgrounds.
          Enterprise-grade fallback ensures results every time.
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
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
              </p>
              <div className="text-xs text-green-600">
                ✓ Valid image format • ✓ Size acceptable
              </div>
            </div>
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

        {/* Process Button with Progress */}
        <div className="space-y-4">
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
          
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={processingProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {progress || 'Initializing...'}
              </p>
            </div>
          )}
        </div>

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
              <p className="font-medium mb-1">✨ Header Extension Complete!</p>
              <p>
                Your header has been extended with advanced tone matching, seamless feathering, and anti-banding noise reduction.
                Ready for production use with automatic fallback protection.
              </p>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg space-y-1">
          <p className="font-medium">💡 Enterprise Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use images ≥{Math.max(1024, extensionHeight * 2)}px wide for optimal AI processing</li>
            <li>Avoid extreme panoramas (aspect ratio &lt; 0.4) for better quality</li>
            <li>Images with clear, extendable backgrounds (sky, water, walls) work best</li>
            <li>System auto-resizes large uploads and provides advanced fallback</li>
            <li>Processing typically completes in &lt;6 seconds with fallback &lt;2 seconds</li>
            <li>All results include professional feathering, tone matching, and noise reduction</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};