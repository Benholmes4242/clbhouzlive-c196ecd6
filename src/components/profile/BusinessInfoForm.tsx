
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BusinessInfoFormProps {
  formData: {
    businessName: string;
    businessType: string;
    contactPersonName: string;
    phone: string;
    websiteUrl: string;
    location: string;
    bio: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (field: string, value: string) => void;
}

const BusinessInfoForm = ({ formData, onChange, onSelectChange }: BusinessInfoFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business/Club Name *</Label>
          <Input
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={onChange}
            placeholder="Enter your business or club name"
            required
          />
        </div>

        <div>
          <Label htmlFor="businessType">Type of Business *</Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => onSelectChange('businessType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="golf_club">Golf Club</SelectItem>
              <SelectItem value="pro_shop">Pro Shop</SelectItem>
              <SelectItem value="teaching_academy">Teaching Academy / Coach</SelectItem>
              <SelectItem value="tour_event">Tour / Event</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contactPersonName">Main Contact Person's Name *</Label>
          <Input
            id="contactPersonName"
            name="contactPersonName"
            value={formData.contactPersonName}
            onChange={onChange}
            placeholder="Enter contact person's name"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="Enter phone number"
            type="tel"
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={onChange}
            placeholder="Enter your location"
          />
        </div>

        <div>
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={onChange}
            placeholder="https://yourwebsite.com"
            type="url"
          />
        </div>

        <div>
          <Label htmlFor="bio">About Your Business</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={onChange}
            placeholder="Tell us about your business, services, or what makes you special..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessInfoForm;
