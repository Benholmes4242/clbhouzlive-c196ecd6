
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ManualHandicapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    handicapIndex: number;
    homeClub: string;
  }) => void;
  initialData?: {
    handicapIndex?: number;
    homeClub?: string;
  };
}

const ManualHandicapModal: React.FC<ManualHandicapModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
}) => {
  const [handicapIndex, setHandicapIndex] = useState(
    initialData?.handicapIndex?.toString() || ''
  );
  const [homeClub, setHomeClub] = useState(initialData?.homeClub || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    await onSave({
      handicapIndex: parseFloat(handicapIndex),
      homeClub,
    });
    
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Handicap' : 'Manually Add Handicap'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handicap-index">Handicap Index</Label>
            <Input
              id="handicap-index"
              type="number"
              step="0.1"
              placeholder="e.g., 4.5"
              value={handicapIndex}
              onChange={(e) => setHandicapIndex(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-club">Home Club</Label>
            <Input
              id="home-club"
              type="text"
              placeholder="Enter your home club"
              value={homeClub}
              onChange={(e) => setHomeClub(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !handicapIndex || !homeClub}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saving...' : 'Save Handicap'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualHandicapModal;
