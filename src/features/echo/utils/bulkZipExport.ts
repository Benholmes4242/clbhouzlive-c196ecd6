/**
 * Bulk ZIP Export Utility
 * Export multiple conversations as ZIP archive
 */

import JSZip from 'jszip';
import type { ExportThread } from './exportConversation';

/**
 * Sanitize title for filename
 */
function sanitizeTitle(title: string): string {
  return title
    .slice(0, 50)
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Convert thread to Markdown format
 */
function convertToMarkdown(thread: ExportThread): string {
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

/**
 * Export multiple threads to ZIP
 */
export async function bulkZipExport(
  threads: ExportThread[],
  format: 'json' | 'md' = 'json'
): Promise<void> {
  const zip = new JSZip();
  
  for (const thread of threads) {
    const filename = sanitizeTitle(thread.title) + (format === 'json' ? '.json' : '.md');
    const content = format === 'json'
      ? JSON.stringify(thread, null, 2)
      : convertToMarkdown(thread);
    
    zip.file(filename, content);
    
    // Yield between files to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Echo-Conversations-${new Date().toISOString().split('T')[0]}.zip`;
  a.click();
  
  // Cleanup
  URL.revokeObjectURL(url);
}
