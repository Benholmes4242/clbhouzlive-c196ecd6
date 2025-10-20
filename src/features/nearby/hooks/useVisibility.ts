import { useState, useEffect } from 'react';
import { LIVE_CLUBHOUSE_DATA } from '../config';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'clb_visible_online';

export function useVisibility() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored === 'true' : true;
  });
  const { toast } = useToast();

  const updateVisibility = async (newValue: boolean) => {
    setVisible(newValue);
    
    if (LIVE_CLUBHOUSE_DATA) {
      // TODO: POST /presence/visibility { visible: newValue }
      console.log('POST /presence/visibility', { visible: newValue });
    } else {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    }
    
    toast({
      title: 'Online visibility updated',
      description: newValue ? 'You are now visible to nearby players' : 'You are now hidden from nearby players',
    });
  };

  return { visible, setVisible: updateVisibility };
}
