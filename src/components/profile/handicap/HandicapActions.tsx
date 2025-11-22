
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HandicapActionsProps {
  onEGConnect: () => void;
}

const HandicapActions: React.FC<HandicapActionsProps> = ({ onEGConnect }) => {
  const [showGoverningBodySelect, setShowGoverningBodySelect] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedGoverningBody, setSelectedGoverningBody] = useState('');
  const [manualHandicap, setManualHandicap] = useState('');

  if (showGoverningBodySelect) {
    return (
      <div className="space-y-3">
        <Select value={selectedGoverningBody} onValueChange={setSelectedGoverningBody}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose your governing body" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="england-golf">England Golf</SelectItem>
            <SelectItem value="golf-ireland">Golf Ireland</SelectItem>
            <SelectItem value="usga">USGA</SelectItem>
            <SelectItem value="golf-australia">Golf Australia</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              onEGConnect();
              setShowGoverningBodySelect(false);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!selectedGoverningBody}
          >
            Connect
          </Button>
          <Button 
            onClick={() => setShowGoverningBodySelect(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (showManualEntry) {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="manual-handicap" className="text-body-sm font-medium">
            Enter your handicap
          </Label>
          <Input
            id="manual-handicap"
            type="number"
            step="0.1"
            placeholder="e.g. 4.5"
            value={manualHandicap}
            onChange={(e) => setManualHandicap(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              console.log('Save manual handicap:', manualHandicap);
              setShowManualEntry(false);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!manualHandicap}
          >
            Save
          </Button>
          <Button 
            onClick={() => setShowManualEntry(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button 
        onClick={() => setShowGoverningBodySelect(true)}
        className="w-full bg-green-600 hover:bg-green-700 mb-2"
      >
        Connect Official Handicap
      </Button>
      <Button 
        onClick={() => setShowManualEntry(true)}
        variant="outline"
        className="w-full"
      >
        Or Add Manual Handicap
      </Button>
    </div>
  );
};

export default HandicapActions;
