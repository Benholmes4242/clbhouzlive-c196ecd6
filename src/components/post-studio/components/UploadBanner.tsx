// UploadBanner — Live upload progress, light mode
import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { TEXT_PRIMARY, TEXT_SECONDARY, ICON_BG, ICON_COLOR } from '../tokens';

export function UploadBanner() {
  const { isUploading, uploadedCount, totalCount } = useUploadProgress();
  const [showGreen, setShowGreen] = useState(false);
  const prevComplete = useRef(false);

  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;
  const isComplete = uploadedCount >= totalCount && totalCount > 0;

  useEffect(() => {
    if (isComplete && !prevComplete.current) {
      setShowGreen(true);
      const timer = setTimeout(() => setShowGreen(false), 500);
      return () => clearTimeout(timer);
    }
    prevComplete.current = isComplete;
  }, [isComplete]);

  const cardStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 20,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  };

  const iconWrapStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: ICON_BG,
    border: '1px solid rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  if (!isUploading && totalCount === 0) {
    return (
      <div style={cardStyle}>
        <div style={iconWrapStyle}>
          <Upload className="w-5 h-5" style={{ color: ICON_COLOR }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 500 }}>Queued</p>
          <p style={{ color: TEXT_SECONDARY, fontSize: 12 }}>Upload will start shortly…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={iconWrapStyle}>
        {isComplete
          ? <span style={{ fontSize: 18, color: TEXT_PRIMARY }}>✓</span>
          : <Upload className="w-5 h-5" style={{ color: ICON_COLOR }} />}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: 500 }}>
            {isComplete ? 'Uploaded' : 'Uploading…'}
          </p>
          <p style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{uploadedCount}/{totalCount}</p>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            transition: 'all 500ms',
            width: `${progress}%`,
            background: showGreen ? 'rgba(15,23,42,0.85)' : 'linear-gradient(90deg, rgba(15,23,42,0.75), rgba(15,23,42,0.55))',
          }} />
        </div>
      </div>
    </div>
  );
}
