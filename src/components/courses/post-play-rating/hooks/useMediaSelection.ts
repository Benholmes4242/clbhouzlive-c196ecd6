import { useCallback } from 'react';
import { toast } from 'sonner';
import { getMediaType } from '@/utils/getMediaType';
import { getFileKey } from '@/hooks/useReviewVideoUpload';
import { MAX_REVIEW_MEDIA_ITEMS } from '../constants';

interface UseMediaSelectionOptions {
  totalMediaCount: number;
  onImagesAdded: (files: File[], previews: Map<string, string>) => void;
  onVideoUpload: (file: File) => void;
  setLocalVideoPosters: (fn: (prev: Map<string, string>) => Map<string, string>) => void;
}

export function useMediaSelection({
  totalMediaCount,
  onImagesAdded,
  onVideoUpload,
  setLocalVideoPosters,
}: UseMediaSelectionOptions) {

  const handleMediaSelected = useCallback(async (files: File[]) => {
    console.log('[Media Audit] CHECKPOINT A - Picked items:', files);
    console.log(
      '[Media Audit] CHECKPOINT A1 - Picked details:',
      files.map((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return {
          name: f.name,
          size: f.size,
          type: f.type,
          ext,
          inferred: getMediaType(f),
        };
      })
    );

    const remainingSlots = MAX_REVIEW_MEDIA_ITEMS - totalMediaCount;
    const filesToAdd = files.slice(0, Math.max(0, remainingSlots));

    if (filesToAdd.length === 0) {
      if (remainingSlots <= 0) {
        toast.success(`${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added`, {
          description: `You can attach up to ${MAX_REVIEW_MEDIA_ITEMS} photos or videos per review.`,
        });
      }
      return;
    }

    if (files.length > remainingSlots && remainingSlots > 0) {
      toast.success(`${MAX_REVIEW_MEDIA_ITEMS} of ${MAX_REVIEW_MEDIA_ITEMS} added`, {
        description: `You can attach up to ${MAX_REVIEW_MEDIA_ITEMS} photos or videos per review.`,
      });
    }

    const imageFiles: File[] = [];
    const videoFiles: File[] = [];
    
    for (const file of filesToAdd) {
      const inferred = getMediaType(file);
      if (inferred === 'video') {
        videoFiles.push(file);
      } else {
        imageFiles.push(file);
      }
    }

    console.log('[Media Audit] CHECKPOINT B - Split:', { imageFiles: imageFiles.length, videoFiles: videoFiles.length });

    if (imageFiles.length > 0) {
      const newPreviews = new Map<string, string>();
      for (const file of imageFiles) {
        const fileKey = getFileKey(file);
        const previewUrl = URL.createObjectURL(file);
        newPreviews.set(fileKey, previewUrl);
      }
      onImagesAdded(imageFiles, newPreviews);
      console.log('[Media Audit] CHECKPOINT C1 - Image previews created:', newPreviews.size);
    }

    if (videoFiles.length > 0) {
      for (const file of videoFiles) {
        const fileKey = getFileKey(file);
        
        try {
          const videoUrl = URL.createObjectURL(file);
          setLocalVideoPosters((prev) => {
            const next = new Map(prev);
            next.set(fileKey, videoUrl);
            return next;
          });
        } catch (posterErr) {
          console.warn('[Media Audit] Local poster generation failed:', posterErr);
        }
        
        onVideoUpload(file);
      }
      console.log('[Media Audit] CHECKPOINT C2 - Videos queued for upload:', videoFiles.length);
    }
  }, [totalMediaCount, onImagesAdded, onVideoUpload, setLocalVideoPosters]);

  return { handleMediaSelected };
}
