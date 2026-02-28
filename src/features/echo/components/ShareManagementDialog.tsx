/**
 * Share Management Dialog
 * Manage sharing settings including link rotation and message redactions
 */

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getShareInfoForThread, rotateShareLink, setShareRedactions } from '../api/shareActions';
import { fetchThreadDetails } from '../api/threadDetails';
import { toast } from 'sonner';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface RedactionState {
  [messageId: string]: 'none' | 'hide' | 'mask';
}

interface ShareManagementDialogProps {
  threadId: string;
  title: string;
  onClose: () => void;
  onShareRevoked: () => void;
}

export const ShareManagementDialog: React.FC<ShareManagementDialogProps> = ({
  threadId,
  title,
  onClose,
  onShareRevoked,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [redactions, setRedactions] = useState<RedactionState>({});
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [threadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shareInfo, thread] = await Promise.all([
        getShareInfoForThread(threadId),
        fetchThreadDetails(threadId),
      ]);

      if (shareInfo?.token) {
        setShareToken(shareInfo.token);
      }
      
      setMessages(thread.messages || []);
      
      // Initialize redaction state to 'none' for all messages
      const initialState: RedactionState = {};
      (thread.messages || []).forEach((msg: Message) => {
        initialState[msg.id] = 'none';
      });
      setRedactions(initialState);
    } catch (error) {
      console.error('Failed to load share data:', error);
      toast.error('Failed to load share settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    try {
      setSaving(true);
      const newToken = await rotateShareLink(threadId);
      const url = `${window.location.origin}/echo/share/${newToken}`;
      await navigator.clipboard.writeText(url);
      setShareToken(newToken);
      echoHistoryAnalytics.shareRotated({ thread_id: threadId });
      toast.success('New link copied. Old link revoked.', { duration: 2000 });
    } catch (error) {
      console.error('Failed to rotate link:', error);
      toast.error('Failed to rotate link');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRedactions = async () => {
    if (!shareToken) return;

    try {
      setSaving(true);
      const pairs = Object.entries(redactions)
        .filter(([_, action]) => action !== 'none')
        .map(([message_id, action]) => ({
          message_id,
          action: action as 'hide' | 'mask',
        }));

      await setShareRedactions(shareToken, pairs);
      
      const hideCount = pairs.filter(p => p.action === 'hide').length;
      const maskCount = pairs.filter(p => p.action === 'mask').length;
      
      echoHistoryAnalytics.shareRedactionsSaved({
        thread_id: threadId,
        hide_count: hideCount,
        mask_count: maskCount,
      });
      
      toast.success('Redaction rules updated', { duration: 2000 });
    } catch (error) {
      console.error('Failed to save redactions:', error);
      toast.error('Failed to save redactions');
    } finally {
      setSaving(false);
    }
  };

  const toggleRedaction = (messageId: string) => {
    setRedactions(prev => {
      const current = prev[messageId] || 'none';
      const next = current === 'none' ? 'hide' : current === 'hide' ? 'mask' : 'none';
      return { ...prev, [messageId]: next };
    });
  };

  const handlePreview = () => {
    if (shareToken) {
      window.open(`${window.location.origin}/echo/share/${shareToken}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={onClose}>
        <div className="bg-background rounded-sq-md p-6 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-background rounded-sq-md p-6 max-w-2xl w-full max-h-[90vh] mx-4 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Manage Sharing</h2>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-sq-sm transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleRotate}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sq-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} />
            Rotate Link
          </button>
          <button
            onClick={handlePreview}
            disabled={!shareToken}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-sq-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Preview
          </button>
        </div>

        {/* Messages with redaction controls */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Click messages to cycle: Show → Hide → Mask
          </p>
          {messages.map((msg) => {
            const state = redactions[msg.id] || 'none';
            return (
              <button
                key={msg.id}
                onClick={() => toggleRedaction(msg.id)}
                className="w-full text-left p-3 rounded-sq-sm border transition-all hover:border-primary"
                style={{
                  borderColor: state === 'none' ? 'var(--border)' : state === 'hide' ? 'hsl(var(--destructive))' : 'hsl(var(--warning))',
                  opacity: state === 'hide' ? 0.5 : 1,
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {state === 'none' && <Eye size={16} className="text-muted-foreground" />}
                    {state === 'hide' && <EyeOff size={16} className="text-destructive" />}
                    {state === 'mask' && <EyeOff size={16} className="text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      {state !== 'none' && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{
                          backgroundColor: state === 'hide' ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)',
                          color: state === 'hide' ? 'hsl(var(--destructive))' : 'hsl(var(--warning))',
                        }}>
                          {state === 'hide' ? 'Hidden' : 'Masked'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">
                      {state === 'mask' ? '[redacted]' : msg.content}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <button
            onClick={handleSaveRedactions}
            disabled={saving || !shareToken}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-sq-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Redactions'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-sq-sm hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
