/**
 * Modal shown when incomplete uploads are detected on app start
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CloudOff, Upload, Trash2, Clock, Image, Video, AlertCircle } from 'lucide-react';
import { PersistedUploadJob } from '@/lib/uploadDatabase';
import { formatDistanceToNow } from 'date-fns';

interface UploadRecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: PersistedUploadJob[];
  onResumeJob: (job: PersistedUploadJob) => void;
  onDiscardJob: (jobId: string) => void;
  onDiscardAll: () => void;
}

export function UploadRecoveryModal({
  open,
  onOpenChange,
  jobs,
  onResumeJob,
  onDiscardJob,
  onDiscardAll
}: UploadRecoveryModalProps) {
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  if (jobs.length === 0) return null;

  const handleResume = async (job: PersistedUploadJob) => {
    setProcessingJobId(job.id);
    onResumeJob(job);
    onOpenChange(false);
  };

  const handleDiscard = async (jobId: string) => {
    setProcessingJobId(jobId);
    await onDiscardJob(jobId);
    setProcessingJobId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-amber-500" />
            Unfinished Uploads
          </DialogTitle>
          <DialogDescription>
            {jobs.length === 1 
              ? "You have an incomplete upload from a previous session."
              : `You have ${jobs.length} incomplete uploads.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {jobs.map(job => {
            const completedCount = job.mediaItems.filter(m => m.status === 'complete').length;
            const failedCount = job.mediaItems.filter(m => m.status === 'failed').length;
            const percentage = job.totalBytes > 0 
              ? Math.round((job.uploadedBytes / job.totalBytes) * 100)
              : 0;
            const timeAgo = formatDistanceToNow(job.createdAt, { addSuffix: true });

            return (
              <div 
                key={job.id} 
                className="border rounded-lg p-4 bg-card"
              >
                {/* Preview thumbnails */}
                <div className="flex gap-1 mb-3">
                  {job.mediaItems.slice(0, 4).map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="relative w-12 h-12 rounded overflow-hidden bg-muted"
                    >
                      {item.thumbnailDataUrl ? (
                        <img 
                          src={item.thumbnailDataUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.mediaType === 'video' ? (
                            <Video className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Image className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {item.status === 'failed' && (
                        <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {item.status === 'complete' && (
                        <div className="absolute bottom-0 right-0 bg-green-500 rounded-tl p-0.5">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {job.mediaItems.length > 4 && (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{job.mediaItems.length - 4}
                    </div>
                  )}
                </div>

                {/* Progress info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {completedCount} of {job.mediaItems.length} files uploaded
                    </span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  
                  {failedCount > 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {failedCount} file{failedCount > 1 ? 's' : ''} failed
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Started {timeAgo}
                  </div>

                  {job.postData.content && (
                    <p className="text-sm line-clamp-1 text-muted-foreground">
                      "{job.postData.content}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleResume(job)}
                    disabled={processingJobId === job.id}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDiscard(job.id)}
                    disabled={processingJobId === job.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length > 1 && (
          <div className="flex justify-end pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDiscardAll}
              className="text-destructive hover:text-destructive"
            >
              Discard All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
