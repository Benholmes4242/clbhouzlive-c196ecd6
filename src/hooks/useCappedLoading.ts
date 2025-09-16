import { useState, useEffect } from 'react';

export function useCappedLoading(actualLoaded: boolean, capMs = 600) {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    if (actualLoaded) {
      const timer = setTimeout(() => setShow(false), 120); // subtle fade
      return () => clearTimeout(timer);
    }
  }, [actualLoaded]);
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), capMs);
    return () => clearTimeout(timer);
  }, [capMs]);
  
  return show;
}