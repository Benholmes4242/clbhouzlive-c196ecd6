import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUSINESS_CATEGORIES, BusinessCategory } from '@/types/profile';

interface BusinessFieldsFormProps {
  businessName: string;
  businessCategory: BusinessCategory | '';
  businessLocation: string;
  businessWebsite: string;
  businessContactEmail: string;
  businessContactPhone: string;
  businessBio: string;
  onChange: (field: string, value: string) => void;
}

export const BusinessFieldsForm: React.FC<BusinessFieldsFormProps> = ({
  businessName,
  businessCategory,
  businessLocation,
  businessWebsite,
  businessContactEmail,
  businessContactPhone,
  businessBio,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-sq-md border border-border">
      <h3 className="font-medium text-foreground">Business Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(e) => onChange('businessName', e.target.value)}
          placeholder="Your business or club name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCategory">Business Category *</Label>
        <Select
          value={businessCategory}
          onValueChange={(value) => onChange('businessCategory', value)}
        >
          <SelectTrigger id="businessCategory">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessLocation">Location</Label>
        <Input
          id="businessLocation"
          value={businessLocation}
          onChange={(e) => onChange('businessLocation', e.target.value)}
          placeholder="City, Country"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessWebsite">Website</Label>
        <Input
          id="businessWebsite"
          type="url"
          value={businessWebsite}
          onChange={(e) => onChange('businessWebsite', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessContactEmail">Contact Email</Label>
          <Input
            id="businessContactEmail"
            type="email"
            value={businessContactEmail}
            onChange={(e) => onChange('businessContactEmail', e.target.value)}
            placeholder="contact@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessContactPhone">Contact Phone</Label>
          <Input
            id="businessContactPhone"
            type="tel"
            value={businessContactPhone}
            onChange={(e) => onChange('businessContactPhone', e.target.value)}
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessBio">About Your Business</Label>
        <Textarea
          id="businessBio"
          value={businessBio}
          onChange={(e) => onChange('businessBio', e.target.value)}
          placeholder="Tell golfers about your business, services, and what makes you unique..."
          rows={4}
        />
      </div>
    </div>
  );
};
