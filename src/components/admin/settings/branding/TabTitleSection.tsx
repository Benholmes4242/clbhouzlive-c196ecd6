
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TabTitleSectionProps {
  tabTitle: string;
  onTabTitleChange: (title: string) => void;
}

const TabTitleSection = ({ tabTitle, onTabTitleChange }: TabTitleSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="tab-title">Tab Title</Label>
      <Input 
        id="tab-title" 
        value={tabTitle}
        onChange={(e) => onTabTitleChange(e.target.value)}
        placeholder="Enter the browser tab title"
      />
    </div>
  );
};

export default TabTitleSection;
