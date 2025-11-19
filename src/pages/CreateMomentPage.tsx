import { useNavigate, useLocation } from 'react-router-dom';
import { useSnapModal } from '@/hooks/useSnapModal';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useOptimisticPostInsertion } from '@/hooks/useOptimisticPostInsertion';
import { updateRecentMediaFromItems } from '@/hooks/usePostSubmission/recentMediaListener';
import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CourseTagInput from '@/components/posts/CourseTagInput';
import { openMediaPicker } from '@/utils/openMediaPicker';
import { normalizeFilesToMediaItems } from '@/lib/mediaUtils';

/**
 * CreateMomentPage - Full-screen page for creating posts
 * Converted from modal to page, maintains exact same styling/behavior
 */
export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { submitPost } = useOptimisticPostSubmission();
  const { addOptimisticPost } = useOptimisticPostInsertion();
  
  const {
    mediaItems,
    setMediaItems,
    selectedCourse,
    setSelectedCourse,
    isSubmitting,
    setIsSubmitting,
    closeComposer,
  } = useSnapModal();

  const [caption, setCaption] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleClose = () => {
    closeComposer();
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handleAddMedia = () => {
    openMediaPicker(async (files) => {
      if (files && files.length > 0) {
        const newItems = await normalizeFilesToMediaItems(files);
        setMediaItems([...mediaItems, ...newItems]);
      }
    });
  };

  const handleRemoveMedia = (index: number) => {
    const newItems = mediaItems.filter((_, i) => i !== index);
    setMediaItems(newItems);
    if (currentMediaIndex >= newItems.length && newItems.length > 0) {
      setCurrentMediaIndex(newItems.length - 1);
    }
  };

  const handleSubmit = async () => {
    const files = mediaItems.map(item => item.file);
    
    if (files.length === 0) {
      toast('No media selected');
      return;
    }

    try {
      setIsSubmitting(true);

      if (user) {
        addOptimisticPost({
          caption,
          files,
          selectedCourse,
          visibility: 'public',
          coverIndex: 0,
          userId: user.id,
          userProfile: {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name,
            username: user.user_metadata?.username,
            profile_photo_url: user.user_metadata?.avatar_url
          }
        });
      }

      if (location.pathname !== '/discover') {
        navigate('/discover');
      }

      if (mediaItems.length > 0) {
        await updateRecentMediaFromItems(mediaItems);
      }

      submitPost({
        user,
        content: caption,
        mediaFiles: files,
        mediaItems,
        selectedTags: [],
        courseInfo: selectedCourse,
        studioEditsByMediaId: {},
        onSuccess: () => {
          setIsSubmitting(false);
          window.dispatchEvent(new CustomEvent('postCompleted', {
            detail: { mediaItems }
          }));
        },
        onError: () => {
          setIsSubmitting(false);
          toast('Upload failed. Please try again later.');
        }
      }).catch(() => {
        setIsSubmitting(false);
        toast('Upload failed. Please try again later.');
      });
      
    } catch (error) {
      console.error('Error in post submission:', error);
      setIsSubmitting(false);
      toast('Upload failed. Please try again later.');
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Create Post</h1>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || mediaItems.length === 0}
          className="bg-primary-accent hover:bg-primary-accent/90"
        >
          {isSubmitting ? 'Posting...' : 'Share'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {mediaItems[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={mediaItems[currentMediaIndex]?.previewUrl || (mediaItems[currentMediaIndex]?.file ? URL.createObjectURL(mediaItems[currentMediaIndex].file!) : '')}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={mediaItems[currentMediaIndex]?.previewUrl || (mediaItems[currentMediaIndex]?.file ? URL.createObjectURL(mediaItems[currentMediaIndex].file!) : '')}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => handleRemoveMedia(currentMediaIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
              {mediaItems.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Media Button */}
          <Button
            variant="outline"
            onClick={handleAddMedia}
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {mediaItems.length === 0 ? 'Add Photos or Videos' : 'Add More Media'}
          </Button>

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />

          {/* Course Tag */}
          <CourseTagInput
            selectedCourse={selectedCourse}
            onCourseSelect={setSelectedCourse}
          />
        </div>
      </div>
    </div>
  );
}
