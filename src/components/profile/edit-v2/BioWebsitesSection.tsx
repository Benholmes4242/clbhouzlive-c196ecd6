import React, { useState } from 'react';
import { Plus, X, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';

interface BioWebsitesSectionProps {
  bio: string;
  websites: string[];
  maxBioLength: number;
  onBioChange: (bio: string) => void;
  onWebsitesChange: (websites: string[]) => void;
}

export const BioWebsitesSection: React.FC<BioWebsitesSectionProps> = ({
  bio,
  websites,
  maxBioLength,
  onBioChange,
  onWebsitesChange,
}) => {
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({});
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxBioLength) {
      onBioChange(value);
    }
  };

  const handleAddWebsite = () => {
    onWebsitesChange([...websites, '']);
  };

  const handleRemoveWebsite = (index: number) => {
    onWebsitesChange(websites.filter((_, i) => i !== index));
  };

  const handleWebsiteChange = (index: number, value: string) => {
    const updated = [...websites];
    updated[index] = value;
    onWebsitesChange(updated);
    // Clear error on edit
    if (urlErrors[index]) {
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleWebsiteBlur = (index: number) => {
    const url = websites[index];
    if (url.trim() && !validateUrl(url)) {
      setUrlErrors(prev => ({ ...prev, [index]: 'Please enter a valid URL' }));
    } else {
      setUrlErrors(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const formatUrlForDisplay = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    }
  };

  const isNearLimit = bio.length >= maxBioLength - 20;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<FileText className="w-5 h-5" />}
        title="Bio & Websites"
        subtitle="Tell people about yourself"
        sectionType="bio"
      />

      <div className="space-y-5">
        {/* Bio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio" className="text-sm font-semibold text-foreground">
              Bio
            </Label>
            <span 
              className={cn(
                "text-xs",
                isNearLimit ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {bio.length}/{maxBioLength}
            </span>
          </div>
          
          <Textarea
            id="bio"
            value={bio}
            onChange={handleBioChange}
            placeholder="Share your favourite club, dream course, or biggest flex..."
            className={cn(
              "min-h-[120px] resize-none text-base transition-all",
              "border-2",
              bio 
                ? "border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20" 
                : "border-dashed border-primary/30 bg-primary/5 focus:border-primary focus:bg-background"
            )}
            maxLength={maxBioLength}
          />
          
          <p className="text-xs text-muted-foreground">
            {bio ? 'Share your golf story' : 'Tell your golf story'}
          </p>
        </div>

        {/* Websites */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Websites</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddWebsite}
              className="h-8 gap-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-4"
            >
              <Plus className="w-4 h-4" />
              Add link
            </Button>
          </div>

          {websites.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No websites added yet. Add links to display on your profile.
            </p>
          )}

          <div className="space-y-3">
            {websites.map((website, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={website}
                      onChange={(e) => handleWebsiteChange(index, e.target.value)}
                      onBlur={() => handleWebsiteBlur(index)}
                      placeholder="https://example.com"
                      className={cn(
                        "pr-28 h-11 text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
                        urlErrors[index] && "border-destructive focus:border-destructive focus:ring-destructive/20"
                      )}
                    />
                    {/* Preview pill */}
                    {website && !urlErrors[index] && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <ExternalLink className="w-3 h-3" />
                        {formatUrlForDisplay(website)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWebsite(index)}
                    className="p-2.5 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {urlErrors[index] && (
                  <div className="flex items-center gap-1 text-xs text-destructive pl-1">
                    <AlertCircle className="w-3 h-3" />
                    {urlErrors[index]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {websites.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Links will appear as capsule buttons on your profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
