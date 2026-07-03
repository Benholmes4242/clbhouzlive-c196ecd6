import React, { useRef } from 'react';
import { Camera, Plus } from 'lucide-react';
import { BIZ } from '@/components/business/businessTokens';

interface Props {
  logoUrl: string | null;
  coverUrl: string | null;
  resolvedName: string;
  onLogoFile: (file: File) => void;
  onLogoRemove: () => void;
  onCoverFile: (file: File) => void;
  onCoverRemove: () => void;
}

/**
 * Cinematic hero for the business editor. Mirrors the personal profile
 * edit-v2 header pattern: full-bleed cover with an "Add/Edit cover"
 * pill top-right, and a squircle logo overlapping the cover bottom-left
 * with an amber "+" upload badge.
 */
export function BusinessHeroCard({
  logoUrl,
  coverUrl,
  resolvedName,
  onLogoFile,
  onLogoRemove,
  onCoverFile,
  onCoverRemove,
}: Props) {
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 pt-2 pb-4">
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid rgba(15,23,42,0.07)',
        }}
      >
        {/* Cover */}
        <label
          className="block relative cursor-pointer"
          style={{
            width: '100%',
            aspectRatio: '3.2 / 1',
            background: coverUrl
              ? 'transparent'
              : 'linear-gradient(135deg,#E2E8F0,#F1F5F9)',
            overflow: 'hidden',
          }}
        >
          <input
            ref={coverInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCoverFile(f);
              if (coverInput.current) coverInput.current.value = '';
            }}
          />
          {coverUrl && (
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />
          )}
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 500,
              padding: '7px 11px',
              borderRadius: 9,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          >
            <Camera size={13} strokeWidth={2.25} />
            {coverUrl ? 'Edit cover' : 'Add cover'}
          </span>
        </label>

        {/* Logo row */}
        <div
          className="relative"
          style={{ padding: '0 16px 14px', marginTop: -34 }}
        >
          <div className="flex items-end justify-between gap-3">
            <div style={{ position: 'relative', width: 78, height: 78 }}>
              <label
                aria-label={logoUrl ? 'Change logo' : 'Add logo'}
                className="cursor-pointer"
                style={{
                  display: 'block',
                  width: 78,
                  height: 78,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: '#E2E8F0',
                  border: '3px solid #ffffff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                }}
              >
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoFile(f);
                    if (logoInput.current) logoInput.current.value = '';
                  }}
                />
                <SquircleAvatar
                  key={logoUrl || 'empty'}
                  src={logoUrl || undefined}
                  fallback={resolvedName?.[0] || 'B'}
                  size={72}
                />
              </label>
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                aria-label={logoUrl ? 'Change logo' : 'Add logo'}
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 27,
                  height: 27,
                  borderRadius: '50%',
                  background: BIZ.amber,
                  border: '2.5px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 2px 6px rgba(247,147,30,0.35)',
                }}
              >
                <Plus size={13} strokeWidth={2.5} style={{ color: '#fff' }} />
              </button>
            </div>

            <div className="flex items-center gap-3 pb-1">
              {logoUrl && (
                <button
                  type="button"
                  onClick={onLogoRemove}
                  className="text-[12px] font-medium text-destructive"
                >
                  Remove logo
                </button>
              )}
              {coverUrl && (
                <button
                  type="button"
                  onClick={onCoverRemove}
                  className="text-[12px] font-medium text-destructive"
                >
                  Remove cover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
