// UploadBanner — Live upload progress, dark glass spec
import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useUploadProgress } from '@/hooks/useUploadProgress';

const WHITE_90 = 'rgba(255,255,255,0.90)';
const WHITE_70 = 'rgba(255,255,255,0.70)';

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
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 20,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  };

  const iconWrapStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  if (!isUploading && totalCount === 0) {
    return (
      <div style={cardStyle}>
        <div style={iconWrapStyle}>
          <Upload className="w-5 h-5" style={{ color: WHITE_90 }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: 500 }}>Queued</p>
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>Upload will start shortly…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={iconWrapStyle}>
        {isComplete
          ? <span style={{ fontSize: 18, color: '#22c55e' }}>✓</span>
          : <Upload className="w-5 h-5" style={{ color: AMBER }} />}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: 500 }}>
            {isComplete ? 'Uploaded' : 'Uploading…'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>{uploadedCount}/{totalCount}</p>
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            transition: 'all 500ms',
            width: `${progress}%`,
            background: showGreen ? '#22c55e' : `linear-gradient(90deg, ${AMBER}, ${AMBER_DEEP})`,
          }} />
        </div>
      </div>
    </div>
  );
}
