import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookmarkIcon, PlusIcon, TrashIcon, StarIcon, ClipboardCopyIcon } from 'lucide-react';
import { DashboardView } from '../api/views';
import { toast } from 'sonner';

interface SavedViewsMenuProps {
  views: DashboardView[];
  activeViewId: string | null;
  onSelect: (id: string) => void;
  onSave: (name: string, setDefault?: boolean) => Promise<void>;
  onOverwrite: () => Promise<void>;
  onSetDefault: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCopyLink: () => void;
}

export function SavedViewsMenu({
  views,
  activeViewId,
  onSelect,
  onSave,
  onOverwrite,
  onSetDefault,
  onDelete,
  onCopyLink,
}: SavedViewsMenuProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const activeView = views.find((v) => v.id === activeViewId);

  const handleSave = async () => {
    if (!newViewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }
    try {
      await onSave(newViewName.trim());
      setSaveDialogOpen(false);
      setNewViewName('');
      toast.success('View saved');
    } catch (error) {
      toast.error('Failed to save view');
    }
  };

  const handleOverwrite = async () => {
    try {
      await onOverwrite();
      toast.success('View updated');
    } catch (error) {
      toast.error('Failed to update view');
    }
  };

  const handleSetDefault = async () => {
    try {
      await onSetDefault();
      toast.success('Default view set');
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this view?')) return;
    try {
      await onDelete();
      toast.success('View deleted');
    } catch (error) {
      toast.error('Failed to delete view');
    }
  };

  const handleCopyLink = () => {
    onCopyLink();
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookmarkIcon className="h-4 w-4" />
            {activeView ? activeView.name : 'Saved Views'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {views.length > 0 && (
            <>
              {views.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onSelect(view.id)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {view.is_default && <StarIcon className="h-3 w-3 fill-current" />}
                    {view.name}
                  </span>
                  {activeViewId === view.id && <span className="text-xs opacity-60">●</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Save Current
          </DropdownMenuItem>
          {activeViewId && (
            <>
              <DropdownMenuItem onClick={handleOverwrite}>
                Overwrite "{activeView?.name}"
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSetDefault}>
                <StarIcon className="mr-2 h-4 w-4" />
                Set as Default
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <ClipboardCopyIcon className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete View
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Dashboard View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
