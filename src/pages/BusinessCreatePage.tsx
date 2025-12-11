import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, MapPin, Globe, Mail, Phone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import PageRoot from '@/components/layout/PageRoot';

const BusinessCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessLocation: '',
    businessWebsite: '',
    businessContactEmail: '',
    businessContactPhone: '',
    businessBio: '',
  });

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_type: 'business',
          display_name: formData.businessName,
          business_name: formData.businessName,
          business_category: formData.businessCategory || null,
          business_location: formData.businessLocation || null,
          business_website: formData.businessWebsite || null,
          business_contact_email: formData.businessContactEmail || null,
          business_contact_phone: formData.businessContactPhone || null,
          business_bio: formData.businessBio || null,
          is_business_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile cache
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast.success('Business profile created!');
      navigate(`/profile/${profile?.username || user.id}`);
    } catch (error) {
      console.error('Error creating business profile:', error);
      toast.error('Failed to create business profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b safe-top">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-sq-sm transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Create Business Profile</h1>
              <p className="text-sm text-muted-foreground">
                Set up your golf club, academy, or brand
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Info banner */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Business profiles get more visibility</p>
              <p className="text-muted-foreground mt-1">
                Your business will appear in the directory and can receive reviews, messages, and follows from golfers.
              </p>
            </div>
          </div>
        </Card>

        {/* Business Identity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="w-4 h-4" />
            <h3 className="font-medium">Business Identity</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="e.g., Royal Golf Club"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessCategory">Category</Label>
            <Select
              value={formData.businessCategory}
              onValueChange={(value) => handleInputChange('businessCategory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessBio">About Your Business</Label>
            <Textarea
              id="businessBio"
              value={formData.businessBio}
              onChange={(e) => handleInputChange('businessBio', e.target.value)}
              placeholder="Tell golfers about your business..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.businessBio.length}/500
            </p>
          </div>
        </Card>

        {/* Location & Contact */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="w-4 h-4" />
            <h3 className="font-medium">Location & Contact</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessLocation">Location</Label>
            <Input
              id="businessLocation"
              value={formData.businessLocation}
              onChange={(e) => handleInputChange('businessLocation', e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessWebsite" className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Website
            </Label>
            <Input
              id="businessWebsite"
              value={formData.businessWebsite}
              onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessContactEmail" className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Contact Email
              </Label>
              <Input
                id="businessContactEmail"
                type="email"
                value={formData.businessContactEmail}
                onChange={(e) => handleInputChange('businessContactEmail', e.target.value)}
                placeholder="contact@business.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessContactPhone" className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Phone
              </Label>
              <Input
                id="businessContactPhone"
                type="tel"
                value={formData.businessContactPhone}
                onChange={(e) => handleInputChange('businessContactPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !formData.businessName.trim()}
            className="flex-1"
          >
            {saving ? 'Creating...' : 'Create Business'}
          </Button>
        </div>
      </div>
    </PageRoot>
  );
};

export default BusinessCreatePage;