/**
 * Enhanced upload progress indicator with connection status
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  X, 
  Pause, 
  Play, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { UploadJobProgress } from '@/hooks/useResilientUpload';

interface UploadProgressIndicatorProps {
  jobs: UploadJobProgress[];
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadProgressIndicator({
  jobs,
  onPause,
  onResume,
  onCancel,
  onRetry
}: UploadProgressIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedJobIds, setCompletedJobIds] = useState<Set<string>>(new Set());

  // Track completed jobs to show success state briefly
  useEffect(() => {
    jobs.forEach(job => {
      if (job.status === 'complete' && !completedJobIds.has(job.jobId)) {
        setCompletedJobIds(prev => new Set(prev).add(job.jobId));
        // Remove from tracking after animation
        setTimeout(() => {
          setCompletedJobIds(prev => {
            const next = new Set(prev);
            next.delete(job.jobId);
            return next;
          });
        }, 3000);
      }
    });
  }, [jobs, completedJobIds]);

  const activeJobs = jobs.filter(j => j.status !== 'complete' || completedJobIds.has(j.jobId));

  if (activeJobs.length === 0) return null;

  const getStatusIcon = (status: UploadJobProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'waiting_connection':
        return <WifiOff className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = (job: UploadJobProgress) => {
    switch (job.status) {
      case 'uploading':
        return `Uploading ${job.currentFileIndex + 1} of ${job.totalFiles}...`;
      case 'paused':
        return 'Paused';
      case 'waiting_connection':
        return 'Waiting for connection...';
      case 'failed':
        return `${job.failedFiles.length} file${job.failedFiles.length > 1 ? 's' : ''} failed`;
      case 'complete':
        return 'Complete!';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80"
      >
        <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="font-medium text-sm">
                {activeJobs.length} upload{activeJobs.length > 1 ? 's' : ''}
              </span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>

          {/* Jobs list */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t max-h-64 overflow-y-auto">
                  {activeJobs.map(job => (
                    <div 
                      key={job.jobId} 
                      className="px-4 py-3 border-b last:border-b-0"
                    >
                      {/* Status and file info */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span className="text-sm">
                            {getStatusText(job)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {job.percentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <Progress 
                        value={job.percentage} 
                        className={`h-2 mb-2 ${
                          job.status === 'failed' ? '[&>div]:bg-destructive' : 
                          job.status === 'complete' ? '[&>div]:bg-green-500' : ''
                        }`}
                      />

                      {/* Details */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {formatBytes(job.uploadedBytes)} / {formatBytes(job.totalBytes)}
                        </span>
                        {job.estimatedTimeRemaining && job.status === 'uploading' && (
                          <span>~{formatTime(job.estimatedTimeRemaining)} left</span>
                        )}
                      </div>

                      {/* Current file name */}
                      {job.currentFileName && job.status === 'uploading' && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {job.currentFileName}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1 mt-2">
                        {job.status === 'uploading' && onPause && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onPause(job.jobId)}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        
                        {(job.status === 'paused' || job.status === 'waiting_connection') && onResume && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onResume(job.jobId)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                        )}
                        
                        {job.status === 'failed' && onRetry && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onRetry(job.jobId)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                        
                        {job.status !== 'complete' && onCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => onCancel(job.jobId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
