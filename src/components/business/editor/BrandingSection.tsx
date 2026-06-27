import React, { useRef } from 'react';
import { Camera, Plus } from 'lucide-react';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BIZ } from '@/components/business/businessTokens';

import { LABEL_CLASS } from './editorStyles';

export interface BrandingSectionProps {
  effectiveLogoUrl: string | null;
  effectiveCoverUrl: string | null;
  resolvedName: string;
  onLogoFile: (file: File) => void;
  onLogoRemove: () => void;
  onCoverFile: (file: File) => void;
  onCoverRemove: () => void;
}

export function BrandingSection({
  effectiveLogoUrl,
  effectiveCoverUrl,
  resolvedName,
  onLogoFile,
  onLogoRemove,
  onCoverFile,
  onCoverRemove,
}: BrandingSectionProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="px-4 mt-2 mb-2">
        <SectionHeader tier="standard" kicker="BRANDING" />
      </div>
      <div className="space-y-4 px-4 pb-4">
        <SectionCard>
          <div className="space-y-3">
            <label className={LABEL_CLASS}>Logo</label>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <SquircleAvatar
                  key={effectiveLogoUrl || 'empty'}
                  src={effectiveLogoUrl || undefined}
                  fallback={resolvedName?.[0] || 'B'}
                  size={96}
                />
                <label
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer shadow-sm"
                  style={{ backgroundColor: BIZ.amber }}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onLogoFile(f);
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                  <Plus className="w-4 h-4" />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">
                  {effectiveLogoUrl ? 'Change Logo' : 'Upload Logo'}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Square image recommended. PNG or JPG.
                </p>
                {effectiveLogoUrl && (
                  <button
                    type="button"
                    onClick={onLogoRemove}
                    className="text-[12px] font-medium text-destructive mt-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-3">
            <label className={LABEL_CLASS}>Cover Photo</label>
            <label className="block cursor-pointer">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCoverFile(f);
                  if (coverInputRef.current) coverInputRef.current.value = '';
                }}
                className="hidden"
              />
              {effectiveCoverUrl ? (
                <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden group">
                  <img
                    src={effectiveCoverUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-background" />
                  </div>
                </div>
              ) : (
                <div
                  className="aspect-[3.2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center"
                  style={{ borderColor: BIZ.hairDashed, background: 'rgba(15,23,42,0.03)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'rgba(15,23,42,0.05)', border: `1px solid ${BIZ.hair}` }}
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">Upload cover photo</p>
                  <p className="text-[12px] text-muted-foreground">
                    Recommended: 1600×500px • JPG, PNG, WebP
                  </p>
                </div>
              )}
            </label>
            {effectiveCoverUrl && (
              <button
                type="button"
                onClick={onCoverRemove}
                className="text-[12px] font-medium text-destructive"
              >
                Remove
              </button>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
