/**
 * BusinessEditStep1Info — Step 1 of business edit wizard
 * Business name, category, description
 */
import React from 'react';
import { Flag, ClipboardList } from 'lucide-react';
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
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';

interface BusinessEditStep1Props {
  formData: {
    businessName: string;
    businessCategory: string;
    businessBio: string;
  };
  onFieldChange: (field: string, value: string) => void;
  isClubLinked: boolean;
}

export function BusinessEditStep1Info({
  formData,
  onFieldChange,
  isClubLinked,
}: BusinessEditStep1Props) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="px-4 py-6 max-w-xl mx-auto space-y-6">
        {/* Section icon + heading */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#C1A84C]/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#C1A84C]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
            <p className="text-sm text-muted-foreground">Tell golfers who you are and what you offer</p>
          </div>
        </div>

        {/* Category */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            {isClubLinked ? (
              <>
                <div className="flex items-center gap-2 px-4 min-h-[48px] border border-border rounded-lg bg-muted/50">
                  <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{formData.businessCategory || 'Golf Club'}</span>
                </div>
                <p className="text-xs text-muted-foreground">Linked to a club record.</p>
              </>
            ) : (
              <>
                <Select
                  value={formData.businessCategory}
                  onValueChange={(value) => onFieldChange('businessCategory', value)}
                >
                  <SelectTrigger className="min-h-[48px] rounded-lg border-border bg-card text-foreground focus:ring-2 focus:ring-[#C1A84C]/30 focus:border-[#C1A84C]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES_WITH_ICONS.map((cat) => {
                      const IconComp = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <IconComp className="h-4 w-4 text-muted-foreground" />
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This helps golfers find the right type of business.</p>
              </>
            )}
          </div>

          {/* Business Name */}
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground font-medium">
              Business Name <span className="text-red-500">*</span>
            </Label>
            {isClubLinked ? (
              <>
                <div className="flex items-center gap-2 px-4 min-h-[48px] border border-border rounded-lg bg-muted/50">
                  <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{formData.businessName}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Linked to a club record. Contact support to update.
                </p>
              </>
            ) : (
              <>
                <Input
                  value={formData.businessName}
                  onChange={(e) => onFieldChange('businessName', e.target.value)}
                  placeholder="e.g., Royal Golf Club"
                  className="min-h-[48px] rounded-lg border-border bg-card text-foreground px-4 focus:ring-2 focus:ring-[#C1A84C]/30 focus:border-[#C1A84C]"
                />
                <p className="text-xs text-muted-foreground">This is shown publicly on your profile and in search.</p>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground font-medium">About your business</Label>
            <span className="text-xs text-muted-foreground">
              {formData.businessBio.length}/2500
            </span>
          </div>
          <Textarea
            value={formData.businessBio}
            onChange={(e) => onFieldChange('businessBio', e.target.value)}
            placeholder="Tell golfers about your business..."
            className="min-h-[140px] resize-none rounded-lg border-border bg-card text-foreground focus:ring-2 focus:ring-[#C1A84C]/30 focus:border-[#C1A84C]"
            maxLength={2500}
          />
          <p className="text-xs text-muted-foreground">
            Tip: Mention what makes you different — facilities, coaching style, atmosphere, or events.
          </p>
        </div>
      </div>
    </div>
  );
}
