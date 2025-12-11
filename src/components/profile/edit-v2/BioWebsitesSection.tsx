import React from 'react';
import { FileText, Plus, X, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

  const charsRemaining = maxBioLength - bio.length;
  const isNearLimit = charsRemaining <= 20;
  const isAtLimit = charsRemaining <= 0;

  return (
    <Card className="overflow-hidden bg-white shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Bio & Websites</h3>
            <p className="text-sm text-muted-foreground">
              Tell people about yourself
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span 
                className={cn(
                  "text-xs transition-colors",
                  isAtLimit ? "text-destructive font-medium" :
                  isNearLimit ? "text-amber-600" : 
                  "text-muted-foreground"
                )}
              >
                {bio.length}/{maxBioLength}
              </span>
            </div>
            <div className="relative">
              <Textarea
                id="bio"
                value={bio}
                onChange={handleBioChange}
                placeholder="Tell us about yourself..."
                className={cn(
                  "min-h-[100px] resize-none transition-all",
                  isNearLimit && "pr-4"
                )}
                maxLength={maxBioLength}
              />
              {/* Fade effect when near limit */}
              {isNearLimit && !isAtLimit && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, hsl(var(--amber-100) / 0.3), transparent)'
                  }}
                />
              )}
            </div>
            {isNearLimit && (
              <p className={cn(
                "text-xs",
                isAtLimit ? "text-destructive" : "text-amber-600"
              )}>
                {isAtLimit ? "Character limit reached" : `${charsRemaining} characters remaining`}
              </p>
            )}
          </div>

          {/* Websites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Websites</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWebsite}
                className="h-8 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </Button>
            </div>

            {websites.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
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
                      className="pr-24 h-10"
                    />
                    {/* Preview pill */}
                    {website && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
              <p className="text-xs text-muted-foreground">
                Links will appear as capsule buttons on your profile.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
