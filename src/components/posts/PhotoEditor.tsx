import React, { useState, useRef, useCallback } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, RotateCcw, Crop, Sun, Save, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onSave: (editedFile: File) => void;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({
  isOpen,
  onClose,
  imageFile,
  onSave
}) => {
  const editorRef = useRef<AvatarEditor>(null);
  const [scale, setScale] = useState([1.2]);
  const [rotate, setRotate] = useState(0);
  const [brightness, setBrightness] = useState([1]);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  const handleRotateClockwise = () => {
    setRotate(prev => (prev + 90) % 360);
  };

  const handleRotateCounterClockwise = () => {
    setRotate(prev => (prev - 90 + 360) % 360);
  };

  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    setPosition(position);
  }, []);

  const handleSave = async () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImage();
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new file with the same name but with edited suffix
          const fileName = imageFile.name.replace(/\.[^/.]+$/, '_edited.png');
          const editedFile = new File([blob], fileName, { type: 'image/png' });
          onSave(editedFile);
        }
      }, 'image/png', 0.9);
    }
  };

  const handleCancel = () => {
    // Reset all values
    setScale([1.2]);
    setRotate(0);
    setBrightness([1]);
    setPosition({ x: 0.5, y: 0.5 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Edit Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editor Canvas */}
          <div className="flex justify-center">
            <div className="border rounded-lg overflow-hidden">
              <AvatarEditor
                ref={editorRef}
                image={imageFile}
                width={400}
                height={300}
                border={20}
                borderRadius={8}
                scale={scale[0]}
                rotate={rotate}
                position={position}
                onPositionChange={handlePositionChange}
                style={{
                  filter: `brightness(${brightness[0]})`
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Rotation Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateCounterClockwise}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Rotate Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateClockwise}
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Rotate Right
              </Button>
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Crop className="h-4 w-4" />
                Zoom: {scale[0].toFixed(1)}x
              </Label>
              <Slider
                value={scale}
                onValueChange={setScale}
                min={1}
                max={3}
                step={0.1}
                className="w-full photo-editor-slider"
              />
            </div>

            {/* Brightness Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Brightness: {Math.round(brightness[0] * 100)}%
              </Label>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full photo-editor-slider"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoEditor;