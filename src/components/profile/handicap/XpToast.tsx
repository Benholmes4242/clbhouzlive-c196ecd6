import React, { useEffect, useState } from 'react';

export default function XpToast({ event }: { event?: { id: string; createdAt: string; amount: number; reason: string } }) {
  const [visible, setVisible] = useState(!!event);
  useEffect(() => { 
    if (event) { 
      setVisible(true); 
      const t = setTimeout(() => setVisible(false), 6000); 
      return () => clearTimeout(t); 
    } 
  }, [event]);
  
  if (!event || !visible) return null;
  
  return (
    <div className="mx-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3">
      <span className="font-semibold">+{event.amount} XP</span> &nbsp; You improved your 3-round average!
    </div>
  );
}