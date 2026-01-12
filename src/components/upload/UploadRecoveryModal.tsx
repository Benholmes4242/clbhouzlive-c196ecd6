/**
 * Modal shown when incomplete uploads are detected on app start
 * Dark theme polished design
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CloudUpload, Upload, Trash2, Clock, Image, Video, AlertCircle } from 'lucide-react';
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
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <CloudUpload className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-white">
              Unfinished Uploads
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              You have {jobs.length} incomplete upload{jobs.length !== 1 ? 's' : ''}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto p-4">
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
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-3"
              >
                {/* Preview thumbnails */}
                <div className="flex gap-1.5">
                  {job.mediaItems.slice(0, 4).map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700"
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
                            <Video className="h-5 w-5 text-slate-500" />
                          ) : (
                            <Image className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                      )}
                      {item.status === 'failed' && (
                        <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {item.status === 'complete' && (
                        <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-tl p-0.5">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {job.mediaItems.length > 4 && (
                    <div className="w-14 h-14 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                      +{job.mediaItems.length - 4}
                    </div>
                  )}
                </div>

                {/* Progress info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {completedCount} of {job.mediaItems.length} files uploaded
                    </span>
                    <span className="font-medium text-white">{percentage}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {failedCount > 0 && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {failedCount} file{failedCount > 1 ? 's' : ''} failed
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    Started {timeAgo}
                  </div>

                  {job.postData.content && (
                    <p className="text-sm text-slate-300 line-clamp-1">
                      "{job.postData.content}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResume(job)}
                    disabled={processingJobId === job.id}
                    className="flex-1 py-2.5 rounded-xl bg-white text-slate-900 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    Resume
                  </button>
                  <button
                    onClick={() => handleDiscard(job.id)}
                    disabled={processingJobId === job.id}
                    className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length > 1 && (
          <div className="flex justify-center p-4 border-t border-slate-700">
            <button 
              onClick={onDiscardAll}
              className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
            >
              Discard All
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}