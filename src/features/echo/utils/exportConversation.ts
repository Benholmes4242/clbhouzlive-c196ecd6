/**
 * Export Conversation Utilities
 * Export Echo conversations to JSON and Markdown
 */

interface ExportMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ExportThread {
  thread_id: string;
  title: string;
  created_at: string;
  messages: ExportMessage[];
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time only
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate filename from title and date
 */
function generateFilename(title: string, threadId: string, date: string, extension: 'json' | 'md'): string {
  const dateObj = new Date(date);
  const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
  const safeTitle = title.slice(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `echo-${dateStr}-${safeTitle}.${extension}`;
}

/**
 * Export conversation to JSON
 */
export function exportToJSON(thread: ExportThread): void {
  const data = JSON.stringify(thread, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = generateFilename(thread.title, thread.thread_id, thread.created_at, 'json');
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Export conversation to Markdown
 */
export function exportToMarkdown(thread: ExportThread): void {
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
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const filename = generateFilename(thread.title, thread.thread_id, thread.created_at, 'md');
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Export multiple conversations as ZIP
 * Uses browser-native approach without external dependencies
 */
export async function exportMultipleToZip(
  threads: ExportThread[],
  format: 'json' | 'md'
): Promise<void> {
  // For now, download each file individually
  // TODO: Add JSZip library for proper ZIP support
  for (const thread of threads) {
    if (format === 'json') {
      exportToJSON(thread);
    } else {
      exportToMarkdown(thread);
    }
    // Small delay to avoid overwhelming the browser
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
