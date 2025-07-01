
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HandicapConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: {
    governingBody: string;
    governingBodyId: string;
    handicapIndex: number;
    homeClub: string;
  }) => void;
}

const HandicapConnectModal: React.FC<HandicapConnectModalProps> = ({
  open,
  onOpenChange,
  onConnect,
}) => {
  const [governingBody, setGoverningBody] = useState('');
  const [governingBodyId, setGoverningBodyId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Mock data for demonstration - in real implementation this would connect to the API
    const mockData = {
      governingBody,
      governingBodyId,
      handicapIndex: 4.5, // Mock handicap value
      homeClub: 'Sundridge Park', // Mock home club
    };
    
    await onConnect(mockData);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Your Official Handicap</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Select your official handicap body and enter your registered ID number to connect.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="governing-body">Governing Body</Label>
            <Select value={governingBody} onValueChange={setGoverningBody} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your governing body" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="england-golf">England Golf</SelectItem>
                <SelectItem value="golf-ireland">Golf Ireland</SelectItem>
                <SelectItem value="usga">USGA</SelectItem>
                <SelectItem value="golf-australia">Golf Australia</SelectItem>
                <SelectItem value="scottish-golf">Scottish Golf</SelectItem>
                <SelectItem value="wales-golf">Wales Golf</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="governing-body-id">Governing Body ID</Label>
            <Input
              id="governing-body-id"
              type="text"
              placeholder="Enter your registered ID"
              value={governingBodyId}
              onChange={(e) => setGoverningBodyId(e.target.value)}
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
              disabled={saving || !governingBody || !governingBodyId}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Connecting...' : 'Connect Handicap'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HandicapConnectModal;
