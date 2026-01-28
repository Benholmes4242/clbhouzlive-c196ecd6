import { useEffect, useCallback } from 'react';

interface UseVerificationKeyboardShortcutsOptions {
  enabled: boolean;
  hasSelection: boolean;
  selectMode: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEnterSelectMode: () => void;
}

/**
 * Keyboard shortcuts for verification queue:
 * - A = Approve selected (when in select mode with selection)
 * - R = Reject selected (when in select mode with selection)
 * - Ctrl/Cmd + A = Select all (when in select mode)
 * - Escape = Clear selection / Exit select mode
 * - S = Enter select mode (when not in select mode)
 */
export function useVerificationKeyboardShortcuts({
  enabled,
  hasSelection,
  selectMode,
  onApprove,
  onReject,
  onSelectAll,
  onClearSelection,
  onEnterSelectMode,
}: UseVerificationKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Escape - clear selection or exit select mode
    if (key === 'escape') {
      event.preventDefault();
      onClearSelection();
      return;
    }

    // S - Enter select mode
    if (key === 's' && !selectMode && !isCtrlOrCmd) {
      event.preventDefault();
      onEnterSelectMode();
      return;
    }

    // Only handle action shortcuts in select mode with selection
    if (!selectMode) return;

    // Ctrl/Cmd + A - Select all
    if (key === 'a' && isCtrlOrCmd) {
      event.preventDefault();
      onSelectAll();
      return;
    }

    // A - Approve selected (without Ctrl/Cmd)
    if (key === 'a' && !isCtrlOrCmd && hasSelection) {
      event.preventDefault();
      onApprove();
      return;
    }

    // R - Reject selected
    if (key === 'r' && hasSelection) {
      event.preventDefault();
      onReject();
      return;
    }
  }, [enabled, hasSelection, selectMode, onApprove, onReject, onSelectAll, onClearSelection, onEnterSelectMode]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}
