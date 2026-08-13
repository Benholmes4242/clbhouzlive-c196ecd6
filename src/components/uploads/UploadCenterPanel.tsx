// Upload Center Panel - shows active and failed uploads

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, AlertCircle, RotateCcw, Cloud, Trash2 } from 'lucide-react';
import { useUploadJobs } from '@/uploads/useUploadJobs';
import type { UploadJob } from '@/uploads/types';

interface UploadCenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadCenterPanel({ isOpen, onClose }: UploadCenterPanelProps) {
  const { jobs, retry, dismiss } = useUploadJobs();

  // Filter to show recent/relevant jobs, sorted newest-first
  const visibleJobs = jobs
    .filter(j => {
      // Always show pending and failed
      if (j.status !== 'complete') return true;
      // Show completed jobs from last 5 minutes
      const age = Date.now() - new Date(j.createdAt).getTime();
      return age < 5 * 60 * 1000;
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-4 w-80 max-h-[70vh] bg-white border border-slate-200 rounded-sq-lg shadow-xl z-[61] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-sm text-slate-900">Upload Center</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {visibleJobs.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  No uploads yet
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {visibleJobs.map(job => (
                    <UploadJobRow
                      key={job.jobId}
                      job={job}
                      onRetry={() => retry(job.jobId)}
                      onDismiss={() => dismiss(job.jobId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function UploadJobRow({
  job,
  onRetry,
  onDismiss,
}: {
  job: UploadJob;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const isPending = ['queued', 'creating_post', 'uploading_media', 'finalizing'].includes(job.status);
  const isComplete = job.status === 'complete';
  const isFailed = job.status === 'failed';

  const statusLabel = {
    queued: 'Queued',
    creating_post: 'Creating post...',
    uploading_media: 'Uploading media...',
    finalizing: 'Finalizing...',
    complete: 'Posted',
    failed: 'Failed',
  }[job.status];

  const progressPercent = job.progress.totalFiles > 0
    ? Math.round((job.progress.uploadedFiles / job.progress.totalFiles) * 100)
    : 0;

  return (
    <div className="px-4 py-3">
      {/* Top row: caption preview + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {job.caption || '(No caption)'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {job.actorType === 'business' ? 'Business post' : 'Personal post'}
          </p>
        </div>
        
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isPending && (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          )}
          {isComplete && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {isFailed && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Progress bar for pending uploads */}
      {isPending && job.progress.totalFiles > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 tabular-nums">
              {job.progress.uploadedFiles}/{job.progress.totalFiles}
            </span>
          </div>
        </div>
      )}

      {/* Status label + actions */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${isFailed ? 'text-red-500' : 'text-slate-500'}`}>
          {statusLabel}
        </span>

        <div className="flex items-center gap-1">
          {isFailed && job.files.length > 0 && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-slate-100 rounded-sq-sm transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          )}
          
          {(isComplete || isFailed) && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sq-sm transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {isFailed && job.error && (
        <p className="mt-1.5 text-xs text-red-500/80">
          {job.error}
        </p>
      )}
    </div>
  );
}
