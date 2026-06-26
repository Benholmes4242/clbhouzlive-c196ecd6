import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateFiles } from '@/components/posts/utils/fileValidation';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { edgePost } from '@/utils/callEdge';

/**
 * A single media input for the post. We accept either:
 * - { kind: 'file', file, originalUrl? } — new local upload (image or video).
 * - { kind: 'restoredVideo', streamId, mediaUrl, posterUrl?, width?, height?, durationSeconds? }
 *   for videos already in Cloudflare Stream (e.g. resumed-from-draft).
 *   These bypass the upload step and are attached to the post directly.
 */
export type MediaInput =
  | { kind: 'file'; file: File; originalUrl?: string | null }
  | {
      kind: 'restoredVideo';
      streamId: string;
      mediaUrl: string;
      posterUrl?: string | null;
      width?: number | null;
      height?: number | null;
      durationSeconds?: number | null;
    };

interface PostSubmissionData {
  user: any;
  content: string;
  /** Legacy path — parallel `mediaFiles`/`originalMediaUrls`. Prefer `mediaInputs`. */
  mediaFiles?: File[];
  originalMediaUrls?: Array<string | null>;
  /** Ordered, unified media list (preferred). When set, supersedes mediaFiles. */
  mediaInputs?: MediaInput[];

  selectedTags: any[];
  /** Single primary course (legacy / back-compat). Use `courses` for multi-course. */
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  /** Ordered list of tagged courses. First entry becomes the primary `posts.course_id`. */
  courses?: Array<{ id: string; name?: string; country?: string }> | null;
  /** Actor type for the post (personal or business). Defaults to 'personal'. */
  actorType?: 'personal' | 'business';
  /** Actor id (business id for business posts; defaults to user.id for personal). */
  actorId?: string | null;
  /** Post visibility. Defaults to 'anyone'. */
  visibility?: 'anyone' | 'followers' | 'private';
  /**
   * When set, the post is created as a scheduled post (status='scheduled',
   * scheduled_at=<this>) instead of an immediate publish. The feed event is
   * NOT emitted — the cron publisher emits it when the post goes live.
   */
  scheduledAt?: Date | null;
  onSuccess?: (postId?: string) => void;
  onError?: () => void;
}

export const usePostSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    originalMediaUrls,
    mediaInputs,
    selectedTags,
    courseInfo,
    courses,
    actorType = 'personal',
    actorId,
    visibility = 'anyone',
    scheduledAt = null,
    onSuccess,
    onError
  }: PostSubmissionData) => {
    setIsSubmitting(true);

    try {
      // Normalise to a single ordered MediaInput[] regardless of caller shape.
      const inputs: MediaInput[] =
        mediaInputs && mediaInputs.length > 0
          ? mediaInputs
          : (mediaFiles || []).map((f, i) => ({
              kind: 'file' as const,
              file: f,
              originalUrl: originalMediaUrls?.[i] ?? null,
            }));

      // Validate any net-new files (restored videos skip validation).
      const filesToValidate = inputs
        .filter((it): it is Extract<MediaInput, { kind: 'file' }> => it.kind === 'file')
        .map((it) => it.file);
      if (filesToValidate.length > 0) {
        const validation = validateFiles(filesToValidate);
        if (!validation.isValid) {
          toast.error('Upload Error', { description: validation.error });
          onError?.();
          return;
        }
      }

      // Resolve the ordered list of course ids (dedupe, preserve order).
      const orderedCourseIds: string[] = (() => {
        const list = courses && courses.length > 0
          ? courses.map((c) => c.id)
          : courseInfo
            ? [courseInfo.id]
            : [];
        const seen = new Set<string>();
        const out: string[] = [];
        for (const id of list) {
          if (id && !seen.has(id)) {
            seen.add(id);
            out.push(id);
          }
        }
        return out;
      })();
      const primaryCourseId = orderedCourseIds[0] ?? null;

      const isScheduled = !!scheduledAt;

      console.log('Creating post with data:', {
        userId: user.id,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        contentLen: content?.length || 0,
        mediaCount: inputs.length,
        courseCount: orderedCourseIds.length,
      });

      // Don't create empty posts - require either content or media
      if (!content?.trim() && inputs.length === 0) {
        throw new Error('Post must have either content or media');
      }

      // Build insert payload. Scheduled posts carry status='scheduled' and
      // scheduled_at; immediate posts use default status.
      const postPayload: Record<string, any> = {
        user_id: user.id,
        content: content || null,
        actor_type: actorType,
        actor_id: actorId ?? user.id,
        course_id: primaryCourseId,
        visibility,
      };
      if (isScheduled) {
        postPayload.status = 'scheduled';
        postPayload.scheduled_at = scheduledAt!.toISOString();
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert(postPayload as any)
        .select()
        .single();


      if (postError) throw postError;

      console.log('Post created:', postData.id, isScheduled ? '(scheduled)' : '');

      // Populate the post_courses junction for the full set (including primary).
      if (orderedCourseIds.length > 0) {
        const rows = orderedCourseIds.map((course_id, i) => ({
          post_id: postData.id,
          course_id,
          display_order: i,
        }));
        const { error: pcError } = await supabase.from('post_courses').insert(rows);
        if (pcError) {
          console.error('[usePostSubmission] post_courses insert failed:', pcError);
          toast.error("Couldn't tag every course", {
            description: 'Some additional courses were not saved.',
          });
        }
      }

      // Upload + attach media in declared order.
      if (inputs.length > 0) {
        const uploadPromises = inputs.map(async (input, index) => {
          try {
            if (input.kind === 'restoredVideo') {
              // Already in Stream — attach by stream_id, no upload needed.
              const poster =
                input.posterUrl ||
                generateStreamThumbnailUrl(input.streamId, { width: 1280, height: 720, time: 1 });
              const { error: mediaError } = await supabase
                .from('post_media')
                .insert({
                  post_id: postData.id,
                  media_type: 'video',
                  media_url: input.mediaUrl,
                  stream_id: input.streamId,
                  poster_url: poster,
                  width: input.width ?? null,
                  height: input.height ?? null,
                  aspect_ratio:
                    input.width && input.height ? input.width / input.height : null,
                  duration_seconds: input.durationSeconds ?? null,
                  display_order: index,
                });
              if (mediaError) throw mediaError;
              return { success: true, fileName: `restored-${input.streamId}` };
            }

            const file = input.file;
            const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
            const fileExtension = file.name.split('.').pop();
            const fullFileName = `${fileName}.${fileExtension}`;

            console.log(`Uploading file ${index + 1}/${inputs.length}: ${file.name} (${file.size} bytes)`);

            // Videos go to Cloudflare Stream (two-step direct upload).
            if (file.type.startsWith('video/')) {
              const initData = await edgePost('cloudflare-stream-upload', {
                fileName: file.name,
                fileSize: file.size,
              });

              if (!initData?.uploadURL || !initData?.uid) {
                throw new Error('Failed to initialize Cloudflare Stream upload');
              }

              const uploadForm = new FormData();
              uploadForm.append('file', file);
              const cfResp = await fetch(initData.uploadURL, {
                method: 'POST',
                body: uploadForm,
              });
              if (!cfResp.ok) {
                throw new Error(`Cloudflare direct upload failed (${cfResp.status})`);
              }

              const hlsUrl = generateStreamHlsUrl(initData.uid);
              const poster = generateStreamThumbnailUrl(initData.uid, {
                width: 1280,
                height: 720,
                time: 1,
              });

              const { error: mediaError } = await supabase
                .from('post_media')
                .insert({
                  post_id: postData.id,
                  media_type: 'video',
                  media_url: hlsUrl,
                  stream_id: initData.uid,
                  poster_url: poster,
                  display_order: index,
                });

              if (mediaError) throw mediaError;
              return { success: true, fileName: file.name };
            }

            // Images → Cloudflare R2.
            const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
            const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-post-images', fullFileName);
            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || 'Upload failed');
            }
            const publicUrl = uploadResult.publicUrl;

            const { error: mediaError } = await supabase
              .from('post_media')
              .insert({
                post_id: postData.id,
                media_type: 'image',
                media_url: publicUrl,
                display_order: index,
                original_media_url: input.originalUrl ?? null,
              });

            if (mediaError) {
              console.error(`Media record error for file ${file.name}:`, mediaError);
              throw mediaError;
            }

            return { success: true, fileName: file.name };
          } catch (error) {
            console.error(`Failed to process media ${index}:`, error);
            return { success: false, fileName: `index-${index}`, error };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.filter((r) => !r.success);
        if (failedUploads.length > 0) {
          console.error('Some uploads failed:', failedUploads);
          throw new Error(`Failed to upload ${failedUploads.length} item(s)`);
        }
      }

      // Only emit the feed event for immediate posts. Scheduled posts must
      // not appear in feeds until the cron publisher publishes them.
      if (!isScheduled) {
        window.dispatchEvent(new CustomEvent('postCompleted', {
          detail: { optimisticId: null, realPost: postData },
        }));
      }

      onSuccess?.(postData.id);

    } catch (error) {
      console.error('Error submitting post:', error);
      onError?.();

      let errorMessage = 'Failed to create post. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to upload')) {
          errorMessage = `Upload failed: ${error.message}`;
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('size')) {
          errorMessage = 'File too large. Please try with smaller files.';
        }
      }

      toast.error("Couldn't post", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPost,
    isSubmitting
  };
};
