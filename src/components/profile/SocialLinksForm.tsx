
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Twitter, Facebook, Globe } from 'lucide-react';

interface SocialLinksFormProps {
  socialLinks: {
    instagram: string;
    twitter: string;
    facebook: string;
    website: string;
  };
  onChange: (platform: string, value: string) => void;
}

const SocialLinksForm = ({ socialLinks, onChange }: SocialLinksFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </Label>
          <Input
            id="instagram"
            value={socialLinks.instagram}
            onChange={(e) => onChange('instagram', e.target.value)}
            placeholder="https://instagram.com/yourbusiness"
            type="url"
          />
        </div>

        <div>
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </Label>
          <Input
            id="twitter"
            value={socialLinks.twitter}
            onChange={(e) => onChange('twitter', e.target.value)}
            placeholder="https://twitter.com/yourbusiness"
            type="url"
          />
        </div>

        <div>
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </Label>
          <Input
            id="facebook"
            value={socialLinks.facebook}
            onChange={(e) => onChange('facebook', e.target.value)}
            placeholder="https://facebook.com/yourbusiness"
            type="url"
          />
        </div>

        <div>
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Additional Website
          </Label>
          <Input
            id="website"
            value={socialLinks.website}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="https://anotherbusinesssite.com"
            type="url"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialLinksForm;
