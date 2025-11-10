/**
 * Export Orchestrator
 * Handles bulk export with progress tracking and cancellation
 */
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { fetchThreadDetails } from '../api/threadDetails';
import type { ThreadDetails } from '../api/threadDetails';

export type FullThread = ThreadDetails;

type Progress = { current: number; total: number; bytes: number };

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

function sanitizeFilename(name: string) {
  return name.trim().replace(/[\\/:"*?<>|]+/g, '_').slice(0, 120);
}

export function startZipExport(opts: {
  threadIds: string[];
  format: 'json'|'md';
  filename?: string;
  onProgress?: (p: Progress) => void;
  onDone?: (blob: Blob) => void;
  onError?: (err: Error) => void;
}) {
  const start = performance.now();
  const total = opts.threadIds.length;
  let canceled = false;

  echoHistoryAnalytics.exportBulkStarted({ count: total, format: opts.format });

  const worker = new Worker(new URL('../../../workers/zip.worker.ts', import.meta.url), { type: 'module' });
  const files: { path: string; contents: string }[] = [];

  let resolved = false;
  const finish = (fn: Function, ...args: any[]) => {
    if (resolved) return;
    resolved = true;
    try { worker.terminate(); } catch {}
    fn(...args);
  };

  worker.onmessage = (ev: MessageEvent) => {
    const msg = ev.data;
    if (msg.type === 'progress') {
      opts.onProgress?.(msg as Progress);
    } else if (msg.type === 'done') {
      const blob: Blob = msg.blob;
      echoHistoryAnalytics.exportCompleted?.({ count: total, bytes: blob.size, duration_ms: Math.round(performance.now() - start) });
      finish(opts.onDone ?? (() => {}), blob);
    } else if (msg.type === 'error') {
      finish(opts.onError ?? (() => {}), new Error(msg.message));
    }
  };

  (async () => {
    const batchSize = 3;
    const errors: string[] = [];

    for (let i = 0; i < total && !canceled; i += batchSize) {
      const batch = opts.threadIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(id => fetchThreadDetails(id)));

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          const t = res.value as FullThread;
          const base = sanitizeFilename(t.title || `conversation_${t.thread_id}`);
          const path = `${base}.${opts.format}`;
          const contents = opts.format === 'json' ? JSON.stringify(t, null, 2) : convertToMarkdown(t);
          files.push({ path, contents });
          // Lightweight progress based on files prepared:
          opts.onProgress?.({ current: Math.min(files.length, total), total, bytes: 0 });
        } else {
          errors.push(batch[idx]);
        }
      });
    }

    if (canceled) return;
    if (errors.length) {
      console.warn('Export skipped threads:', errors);
    }

    worker.postMessage({ task: { format: opts.format, files } });
  })().catch((e) => finish(opts.onError ?? (() => {}), e as Error));

  return {
    cancel() {
      if (!resolved) {
        canceled = true;
        echoHistoryAnalytics.exportCanceled?.({ current: files.length, total });
        finish(opts.onError ?? (() => {}), new Error('Export canceled'));
      }
    }
  };
}
