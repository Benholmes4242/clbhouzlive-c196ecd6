
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from './PostSubmissionHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const FloatingPostButton = () => {
  const { user } = useSupabaseSession();
  const { submitPost } = usePostSubmission();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleButtonClick = () => {
    if (!user) return;
    // Open file picker with camera option for mobile
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsModalOpen(true);

    // Reset file input
    event.target.value = '';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmitPost = async () => {
    if (!selectedFile || !user) return;

    setIsSubmitting(true);
    
    try {
      await submitPost({
        user,
        content: caption,
        mediaFiles: [selectedFile],
        selectedTags: [],
        onSuccess: () => {
          handleCloseModal();
          // Don't reload the page, let the post submission handler handle UI updates
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error submitting post:', error);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="floating-post-button">
        <button 
          className="post-btn"
          onClick={handleButtonClick}
          aria-label="Create post"
        >
          <div className="plus-icon">
            <Camera className="h-5 w-5" />
          </div>
          <div className="post-label">Post</div>
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Media Preview */}
            <div className="media-preview-container">
              {selectedFile && (
                <div className="w-full">
                  {selectedFile.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  ) : selectedFile.type.startsWith('video/') ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-64 rounded-lg"
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div>
              <Textarea
                placeholder="Write your caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPost}
                disabled={isSubmitting || !selectedFile}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .floating-post-button {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }

        .post-btn {
          background-color: #000;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 43.5px;
          height: 43.5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        }

        .post-btn:hover {
          transform: scale(1.05);
        }

        .plus-icon {
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .post-label {
          font-size: 8px;
          margin-top: 1px;
          color: #fff;
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
