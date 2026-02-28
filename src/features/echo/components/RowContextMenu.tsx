/**
 * Row Context Menu
 * Export and share actions for Echo History rows
 */

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Share2, Link2Off, FileJson, FileText, Tag as TagIcon, X, Settings } from 'lucide-react';
import { downloadBlob } from '../utils/download';
import { createShareLink, revokeShareLink, getShareInfoForThread } from '../api/shareActions';
import { fetchThreadDetails } from '../api/threadDetails';
import { getThreadTags, removeTagFromThread } from '../api/tags';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { toast } from 'sonner';
import { TagInputPopover } from './TagInputPopover';
import { ShareManagementDialog } from './ShareManagementDialog';

function convertToMarkdown(thread: any): string {
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

interface RowContextMenuProps {
  threadId: string;
  title: string;
  tags?: string[];
  onTagsChange?: () => void;
}

export const RowContextMenu: React.FC<RowContextMenuProps> = ({ 
  threadId, 
  title,
  tags = [],
  onTagsChange,
}) => {
  const [open, setOpen] = useState(false);
  const [hasShare, setHasShare] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [threadTags, setThreadTags] = useState<string[]>(tags);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Check if thread has an active share link and fetch tags
  useEffect(() => {
    let mounted = true;
    
    // Fetch share info
    getShareInfoForThread(threadId)
      .then((info) => {
        if (!mounted) return;
        setHasShare(!!info?.token && !info?.revoked_at);
      })
      .catch(() => {
        if (mounted) setHasShare(false);
      });
    
    // Fetch tags if not provided
    if (tags.length === 0) {
      getThreadTags(threadId).then((fetchedTags) => {
        if (mounted) setThreadTags(fetchedTags);
      });
    }
    
    return () => {
      mounted = false;
    };
  }, [threadId, tags]);

  const handleExportJSON = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const thread = await fetchThreadDetails(threadId);
      echoHistoryAnalytics.exportStarted({ thread_id: threadId, format: 'json' });
      const blob = new Blob([JSON.stringify(thread, null, 2)], { type: 'application/json' });
      const filename = `${(thread.title || 'conversation_' + thread.thread_id).replace(/[\\/:"*?<>|]+/g, '_')}.json`;
      downloadBlob(blob, filename);
      toast.success('Exported to JSON', { duration: 2000 });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleExportMD = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const thread = await fetchThreadDetails(threadId);
      echoHistoryAnalytics.exportStarted({ thread_id: threadId, format: 'md' });
      const md = convertToMarkdown(thread);
      const blob = new Blob([md], { type: 'text/markdown' });
      const filename = `${(thread.title || 'conversation_' + thread.thread_id).replace(/[\\/:"*?<>|]+/g, '_')}.md`;
      downloadBlob(blob, filename);
      toast.success('Exported to Markdown', { duration: 2000 });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleShareCreate = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const token = await createShareLink(threadId);
      const url = `${window.location.origin}/echo/share/${token}`;
      await navigator.clipboard.writeText(url);
      echoHistoryAnalytics.shareCreated({ thread_id: threadId });
      toast.success('Share link copied to clipboard', { duration: 2000 });
      setHasShare(true);
    } catch (error) {
      console.error('Share creation failed:', error);
      toast.error('Failed to create share link', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleShareRevoke = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const info = await getShareInfoForThread(threadId);
      if (!info?.token) {
        toast('No active share link found', { duration: 2000 });
        return;
      }
      await revokeShareLink(info.token);
      echoHistoryAnalytics.shareRevoked({ thread_id: threadId });
      toast.success('Share link revoked', { duration: 2000 });
      setHasShare(false);
    } catch (error) {
      console.error('Share revocation failed:', error);
      toast.error('Failed to revoke share link', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    setOpen(false);
    setLoading(true);
    try {
      await removeTagFromThread(threadId, tag);
      echoHistoryAnalytics.tagRemoved({ thread_id: threadId, tag });
      setThreadTags((prev) => prev.filter((t) => t !== tag));
      onTagsChange?.();
      toast.success(`Removed tag: ${tag}`, { duration: 2000 });
    } catch (error) {
      console.error('Failed to remove tag:', error);
      toast.error('Failed to remove tag', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleTagAdded = (tag: string) => {
    setThreadTags((prev) => [...prev, tag]);
    onTagsChange?.();
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        aria-label={`More options for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loading}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/15 transition-colors disabled:opacity-50"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={18} style={{ color: 'var(--hub-text)' }} />
      </button>

      {open && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu */}
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl backdrop-blur-md p-1 z-[9999]"
            style={{
              borderColor: 'var(--hub-stroke)',
              background: 'rgba(22, 24, 27, 0.98)',
            }}
          >
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-body-md"
              style={{ color: 'var(--hub-text)' }}
              onClick={handleExportJSON}
            >
              <FileJson size={16} />
              <span>Export JSON</span>
            </button>
            
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-body-md"
              style={{ color: 'var(--hub-text)' }}
              onClick={handleExportMD}
            >
              <FileText size={16} />
              <span>Export Markdown</span>
            </button>
            
            <div className="h-px my-1" style={{ background: 'var(--hub-stroke)' }} />
            
            {/* Tags */}
            <div className="relative">
              <button
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-body-md"
                style={{ color: 'var(--hub-text)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTagInput(true);
                  setOpen(false);
                }}
              >
                <TagIcon size={16} />
                <span>Add tag...</span>
              </button>
              
              {showTagInput && (
                <TagInputPopover
                  threadId={threadId}
                  existingTags={threadTags}
                  onClose={() => setShowTagInput(false)}
                  onTagAdded={handleTagAdded}
                />
              )}
            </div>
            
            {threadTags.length > 0 && (
              <div className="px-3 py-2">
                <div className="text-meta font-medium mb-1.5" style={{ color: 'var(--hub-text-dim)' }}>
                  Remove tag:
                </div>
                <div className="space-y-1">
                  {threadTags.map((tag) => (
                    <button
                      key={tag}
                      role="menuitem"
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left text-body-sm"
                      style={{ color: 'var(--hub-text)' }}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <span>{tag}</span>
                      <X size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="h-px my-1" style={{ background: 'var(--hub-stroke)' }} />
            
            {!hasShare && (
              <button
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
                style={{ color: 'var(--hub-text)' }}
                onClick={handleShareCreate}
              >
                <Share2 size={16} />
                <span>Create share link</span>
              </button>
            )}
            
            {hasShare && (
              <>
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
                  style={{ color: 'var(--hub-text)' }}
                  onClick={() => {
                    setOpen(false);
                    setShowShareDialog(true);
                  }}
                >
                  <Settings size={16} />
                  <span>Manage sharing</span>
                </button>
                <button
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
                  style={{ color: 'var(--hub-text)' }}
                  onClick={handleShareRevoke}
                >
                  <Link2Off size={16} />
                  <span>Revoke share link</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
      
      {showShareDialog && (
        <ShareManagementDialog
          threadId={threadId}
          title={title}
          onClose={() => setShowShareDialog(false)}
          onShareRevoked={() => {
            setHasShare(false);
            setShowShareDialog(false);
          }}
        />
      )}
    </div>
  );
};
