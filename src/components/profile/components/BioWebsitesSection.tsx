import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X, ExternalLink } from 'lucide-react';
import { BIO_MAX_LENGTH } from '@/constants/profile';

interface BioWebsitesSectionProps {
  bio: string;
  websites: string[];
  onBioChange: (bio: string) => void;
  onWebsitesChange: (websites: string[]) => void;
}

export const BioWebsitesSection: React.FC<BioWebsitesSectionProps> = ({
  bio,
  websites,
  onBioChange,
  onWebsitesChange,
}) => {
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= BIO_MAX_LENGTH) {
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
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold">Bio & Websites</Label>
          <p className="text-sm text-muted-foreground">
            Tell people about yourself and add links to your websites
          </p>
        </div>

        {/* Bio Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="bio"
            value={bio}
            onChange={handleBioChange}
            placeholder="Tell us about yourself..."
            className="min-h-[80px] resize-none"
            maxLength={BIO_MAX_LENGTH}
          />
          {bio.length >= BIO_MAX_LENGTH * 0.9 && (
            <p className="text-xs text-amber-600">
              {BIO_MAX_LENGTH - bio.length} characters remaining
            </p>
          )}
        </div>

        {/* Websites Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Websites</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddWebsite}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Link
            </Button>
          </div>

          {websites.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No websites added yet. Click "Add Link" to get started.
            </p>
          )}

          <div className="space-y-3">
            {websites.map((website, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    value={website}
                    onChange={(e) => handleWebsiteChange(index, e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                </div>
                
                {/* Preview */}
                {website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatUrlForDisplay(website)}
                    </span>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveWebsite(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {websites.length > 0 && (
            <div className="text-xs text-muted-foreground">
              URLs will be automatically formatted with https:// if needed. 
              Only the domain name will be displayed on your profile.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};