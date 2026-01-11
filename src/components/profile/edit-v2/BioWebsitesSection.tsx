import React from 'react';
import { Plus, X, ExternalLink, FileText } from 'lucide-react';
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
    <div className="space-y-4">
      <SectionHeader
        icon={<FileText className="w-5 h-5 text-primary" />}
        title="Bio & Websites"
        subtitle="Tell people about yourself"
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
          
          {!bio ? (
            <button
              type="button"
              onClick={() => {
                // Focus the textarea by setting a space then clearing
                const textarea = document.getElementById('bio') as HTMLTextAreaElement;
                textarea?.focus();
              }}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Tell your golf story
              </p>
              <p className="text-xs text-muted-foreground">
                Share your favourite club, dream course, or biggest flex
              </p>
            </button>
          ) : null}
          
          <Textarea
            id="bio"
            value={bio}
            onChange={handleBioChange}
            placeholder="Share how you play – e.g. favourite club, dream course or biggest golf flex..."
            className={cn(
              "min-h-[100px] resize-none text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
              !bio && "hidden"
            )}
            maxLength={maxBioLength}
          />
          
          {bio && (
            <p className="text-xs text-muted-foreground">
              Share how you play – your favourite club, dream course or biggest golf flex.
            </p>
          )}
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
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={website}
                    onChange={(e) => handleWebsiteChange(index, e.target.value)}
                    placeholder="https://example.com"
                    className="pr-28 h-11 text-base border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {/* Preview pill */}
                  {website && (
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
