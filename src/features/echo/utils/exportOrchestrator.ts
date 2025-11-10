/**
 * Export Orchestrator
 * Handles bulk export with progress tracking and cancellation
 */
import type { ThreadDetails } from '../api/threadDetails';

function convertToMarkdown(thread: ThreadDetails): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  let markdown = `# Echo Conversation — ${thread.title}\n\n`;
  markdown += `**Thread ID:** ${thread.thread_id}\n`;
  markdown += `**Created:** ${formatDate(thread.created_at)}\n\n`;
  markdown += `---\n\n`;
  
  for (const msg of thread.messages) {
    const sender = msg.role === 'user' ? 'You' : 'Echo';
    const time = formatTime(msg.created_at);
    
    markdown += `**${sender}** · ${time}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  }
  
  return markdown;
}

function sanitizeFilename(title: string): string {
  return title
    .slice(0, 50)
    .replace(/[\\/:"*?<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export interface ExportProgress {
  current: number;
  total: number;
  bytes: number;
}

export interface ExportOptions {
  threads: Array<{ id: string; title?: string }>;
  format: 'json' | 'md';
  fetchThread: (id: string) => Promise<ThreadDetails>;
  filename?: string;
  onProgress?: (progress: ExportProgress) => void;
  onDone?: (blob: Blob) => void;
  onError?: (err: Error) => void;
}

export function startZipExport(opts: ExportOptions) {
  const startTime = performance.now();
  const total = opts.threads.length;
  let canceled = false;
  let resolved = false;
  
  const worker = new Worker(
    new URL('../../workers/zip.worker.ts', import.meta.url),
    { type: 'module' }
  );
  
  const files: Array<{ path: string; contents: string }> = [];
  const errors: string[] = [];

  const finish = (fn: Function, ...args: any[]) => {
    if (resolved) return;
    resolved = true;
    worker.terminate();
    fn(...args);
  };

  (async () => {
    const batchSize = 3;
    
    for (let i = 0; i < total && !canceled; i += batchSize) {
      const batch = opts.threads.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(t => opts.fetchThread(t.id))
      );

      results.forEach((res, idx) => {
        const thread = batch[idx];
        if (res.status === 'fulfilled') {
          const threadData = res.value;
          const fileBase = sanitizeFilename(
            thread.title || threadData.title || `conversation_${thread.id}`
          );
          const path = `${fileBase}.${opts.format}`;
          const contents = opts.format === 'json'
            ? JSON.stringify(threadData, null, 2)
            : convertToMarkdown(threadData);
          
          files.push({ path, contents });
          
          // Emit progress after each batch
          opts.onProgress?.({
            current: files.length,
            total,
            bytes: files.reduce((sum, f) => sum + f.contents.length, 0)
          });
        } else {
          errors.push(thread.id);
        }
      });
    }

    if (canceled) return;

    if (files.length === 0) {
      finish(opts.onError ?? (() => {}), new Error('No conversations could be exported'));
      return;
    }

    // Send to worker for zipping
    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      
      if (msg.type === 'progress') {
        opts.onProgress?.(msg);
      } else if (msg.type === 'done') {
        finish(opts.onDone ?? (() => {}), msg.blob);
      } else if (msg.type === 'error') {
        finish(opts.onError ?? (() => {}), new Error(msg.message));
      }
    };

    worker.postMessage({ 
      task: { 
        format: opts.format, 
        files 
      } 
    });
  })().catch(err => {
    finish(opts.onError ?? (() => {}), err);
  });

  return {
    cancel: () => {
      if (!resolved) {
        canceled = true;
        finish(opts.onError ?? (() => {}), new Error('Export canceled'));
      }
    }
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function makeExportFilename(format: 'json' | 'md', count: number = 1): string {
  const date = new Date().toISOString().split('T')[0];
  if (count === 1) {
    return `echo_conversation_${date}.${format}`;
  }
  return `echo_conversations_${date}.zip`;
}
