import React, { useState, useRef } from 'react';
import { Camera, Upload, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingPhotoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

/**
 * B6 - Profile Photo Step
 * Upload avatar with preview
 */
const OnboardingPhoto: React.FC<OnboardingPhotoProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const { user } = useSupabaseSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(data.profilePhotoUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      updateData({ profilePhotoUrl: publicUrl });
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    await saveProgress({ profilePhotoUrl: data.profilePhotoUrl });
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          Add a profile photo
        </h1>
        <p className="text-white/50">
          This helps friends recognise you.
        </p>
      </div>

      {/* Photo Preview */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="relative cursor-pointer group"
        >
          <div 
            className={`w-40 h-40 rounded-full overflow-hidden border-2 transition-colors ${
              previewUrl ? 'border-white/20' : 'border-dashed border-white/30'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <User className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>

          {/* Upload indicator */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-white font-medium hover:bg-white/15 transition-colors"
        >
          <Upload className="w-5 h-5" />
          {previewUrl ? 'Change photo' : 'Choose photo'}
        </motion.button>
      </div>

      {/* CTA */}
      <div className="py-6 space-y-3">
        {previewUrl ? (
          <AuthPrimaryButton onClick={handleNext} disabled={uploading}>
            Next
          </AuthPrimaryButton>
        ) : (
          <>
            <AuthPrimaryButton 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
            >
              Add photo
            </AuthPrimaryButton>
            <AuthSecondaryButton onClick={handleSkip}>
              Maybe later
            </AuthSecondaryButton>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPhoto;
