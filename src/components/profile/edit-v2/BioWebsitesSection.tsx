import React from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Bio & websites</h2>
        <p className="text-xs text-muted-foreground">Tell people about yourself.</p>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio" className="text-xs text-muted-foreground">
              Bio
            </Label>
            <span 
              className={cn(
                "text-[11px]",
                isNearLimit ? "text-muted-foreground" : "text-muted-foreground/70"
              )}
            >
              {bio.length}/{maxBioLength}
            </span>
          </div>
          <Textarea
            id="bio"
            value={bio}
            onChange={handleBioChange}
            placeholder="Share how you play – e.g. favourite club, dream course or biggest golf flex..."
            className="min-h-[80px] resize-none"
            maxLength={maxBioLength}
          />
          <p className="text-[11px] text-muted-foreground">
            Share how you play – your favourite club, dream course or biggest golf flex.
          </p>
        </div>

        {/* Websites */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Websites</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddWebsite}
              className="h-7 gap-1.5 text-xs bg-[#E2E8F0] text-foreground hover:bg-slate-300 rounded-full px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Add link
            </Button>
          </div>

          {websites.length === 0 && (
            <p className="text-[11px] text-muted-foreground py-1">
              No websites added yet. Add links to display on your profile.
            </p>
          )}

          <div className="space-y-2">
            {websites.map((website, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={website}
                    onChange={(e) => handleWebsiteChange(index, e.target.value)}
                    placeholder="https://example.com"
                    className="pr-24 h-9 text-sm"
                  />
                  {/* Preview pill */}
                  {website && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <ExternalLink className="w-3 h-3" />
                      {formatUrlForDisplay(website)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveWebsite(index)}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {websites.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Links will appear as capsule buttons on your profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
