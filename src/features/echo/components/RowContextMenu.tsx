/**
 * Row Context Menu
 * Export and share actions for Echo History rows
 */

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Share2, Link2Off, FileJson, FileText } from 'lucide-react';
import { exportToJSON, exportToMarkdown } from '../utils/exportConversation';
import { createShareLink, revokeShareLink, getShareInfoForThread } from '../api/shareActions';
import { fetchThreadDetails } from '../api/threadDetails';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { toast } from '@/hooks/use-toast';

interface RowContextMenuProps {
  threadId: string;
  title: string;
}

export const RowContextMenu: React.FC<RowContextMenuProps> = ({ threadId, title }) => {
  const [open, setOpen] = useState(false);
  const [hasShare, setHasShare] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if thread has an active share link
  useEffect(() => {
    let mounted = true;
    getShareInfoForThread(threadId)
      .then((info) => {
        if (!mounted) return;
        setHasShare(!!info?.token && !info?.revoked_at);
      })
      .catch(() => {
        if (mounted) setHasShare(false);
      });
    return () => {
      mounted = false;
    };
  }, [threadId]);

  const handleExportJSON = async () => {
    setOpen(false);
    setLoading(true);
    try {
      const thread = await fetchThreadDetails(threadId);
      echoHistoryAnalytics.exportStarted({ thread_id: threadId, format: 'json' });
      exportToJSON(thread);
      toast({ description: 'Exported to JSON', duration: 2000 });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ description: 'Failed to export', variant: 'destructive', duration: 3000 });
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
      exportToMarkdown(thread);
      toast({ description: 'Exported to Markdown', duration: 2000 });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ description: 'Failed to export', variant: 'destructive', duration: 3000 });
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
      toast({ description: 'Share link copied to clipboard', duration: 2000 });
      setHasShare(true);
    } catch (error) {
      console.error('Share creation failed:', error);
      toast({ description: 'Failed to create share link', variant: 'destructive', duration: 3000 });
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
        toast({ description: 'No active share link found', duration: 2000 });
        return;
      }
      await revokeShareLink(info.token);
      echoHistoryAnalytics.shareRevoked({ thread_id: threadId });
      toast({ description: 'Share link revoked', duration: 2000 });
      setHasShare(false);
    } catch (error) {
      console.error('Share revocation failed:', error);
      toast({ description: 'Failed to revoke share link', variant: 'destructive', duration: 3000 });
    } finally {
      setLoading(false);
    }
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
              style={{ color: 'var(--hub-text)' }}
              onClick={handleExportJSON}
            >
              <FileJson size={16} />
              <span>Export JSON</span>
            </button>
            
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
              style={{ color: 'var(--hub-text)' }}
              onClick={handleExportMD}
            >
              <FileText size={16} />
              <span>Export Markdown</span>
            </button>
            
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
              <button
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-[14px]"
                style={{ color: 'var(--hub-text)' }}
                onClick={handleShareRevoke}
              >
                <Link2Off size={16} />
                <span>Revoke share link</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
