import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, DollarSign, Target, Shield, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoachFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  swingAnalysisId: string;
}

interface FormData {
  location: string;
  radiusKm: number;
  focus: string;
  priceMin: number;
  priceMax: number;
  shareVideo: boolean;
  shareAnalysisText: boolean;
  firstNameOnly: boolean;
  maskPreciseLocation: boolean;
  consentGiven: boolean;
}

const COACHING_FOCUS_OPTIONS = [
  'Driver',
  'Irons',
  'Short Game',
  'Putting',
  'General'
];

export const CoachFinderModal: React.FC<CoachFinderModalProps> = ({
  isOpen,
  onClose,
  swingAnalysisId
}) => {
  const [formData, setFormData] = useState<FormData>({
    location: '',
    radiusKm: 25,
    focus: '',
    priceMin: 0,
    priceMax: 200,
    shareVideo: false,
    shareAnalysisText: false,
    firstNameOnly: true,
    maskPreciseLocation: true,
    consentGiven: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const baseValid = formData.location.trim().length > 0;
    const sharingValid = !formData.shareVideo && !formData.shareAnalysisText || formData.consentGiven;
    return baseValid && sharingValid;
  };

  const handleFindCoaches = async () => {
    if (!isFormValid()) return;
    
    setIsLoading(true);
    try {
      console.log('Finding coaches with form data:', formData);
      
      // In a real implementation, you'd geocode the location first
      // For now, we'll use mock coordinates based on UK cities
      const mockLat = 51.5074; // London coordinates as example
      const mockLng = -0.1278;
      
      // Prepare the payload matching the edge function expectations
      const payload = {
        swingAnalysisId,
        lat: mockLat,
        lng: mockLng,
        radiusKm: Number(formData.radiusKm || 25),
        focus: formData.focus || 'Driver',
        priceMin: formData.priceMin > 0 ? Number(formData.priceMin) : null,
        priceMax: formData.priceMax < 200 ? Number(formData.priceMax) : null,
        shareVideo: !!formData.shareVideo,
        shareAnalysisText: !!formData.shareAnalysisText,
        firstNameOnly: !!formData.firstNameOnly,
        maskPreciseLocation: !!formData.maskPreciseLocation,
        // Add location details for context
        city: formData.location.split(',')[0]?.trim() || 'London',
        region: formData.location.split(',')[1]?.trim() || 'Greater London',
        country: formData.location.split(',')[2]?.trim() || 'United Kingdom'
      };
      
      console.log('Sending payload to swing-coach-outreach:', payload);
      
      // Call the swing-coach-outreach edge function
      const { data, error } = await supabase.functions.invoke('swing-coach-outreach', {
        body: payload
      });

      if (error) {
        console.error('Error finding coaches:', error);
        toast.error(error.message || 'Failed to find coaches. Please try again.');
        return;
      }

      console.log('Coach outreach response:', data);
      
      // Set the coaches from the response and go to results step
      if (data?.chosen && Array.isArray(data.chosen)) {
        setCoaches(data.chosen);
        setStep('results');
        toast.success(`${data.chosen.length} coach${data.chosen.length === 1 ? '' : 'es'} found`);
      } else {
        toast.error('No coaches found', { description: 'Try expanding your search radius' });
      }
    } catch (error: any) {
      console.error('Error finding coaches:', error);
      toast.error('Something went wrong', { description: 'Please try again' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (selectedCoaches.length === 0) {
      toast.error('Please select at least one coach');
      return;
    }

    toast.success(`Request sent to ${selectedCoaches.length} coach${selectedCoaches.length > 1 ? 'es' : ''}. They can message you with advice and availability.`);
    onClose();
  };

  const handleClose = () => {
    setStep('form');
    setCoaches([]);
    setSelectedCoaches([]);
    onClose();
  };

  if (step === 'results') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Coaches
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedCoaches(prev => 
                    prev.includes(coach.id) 
                      ? prev.filter(id => id !== coach.id)
                      : [...prev, coach.id].slice(0, 3)
                  );
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedCoaches.includes(coach.id)}
                      />
                      <h3 className="font-medium">{coach.name}</h3>
                    </div>
                    {coach.academy && (
                      <p className="text-sm text-muted-foreground mt-1">{coach.academy}</p>
                    )}
                    {coach.city && (
                      <p className="text-xs text-muted-foreground">{coach.city}</p>
                    )}
                    {coach.specialties && coach.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {coach.specialties.map((specialty: string, idx: number) => (
                          <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {formData.shareVideo || formData.shareAnalysisText ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Your analysis and video will be shared with selected coaches so they can provide personalized feedback.
                </p>
              </div>
            ) : null}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSendRequest}
                disabled={selectedCoaches.length === 0}
              >
                Send Request ({selectedCoaches.length}/3)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Find Local Coaches
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="City, Region, Country"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Radius (km)</Label>
              <Select
                value={formData.radiusKm.toString()}
                onValueChange={(value) => handleInputChange('radiusKm', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coaching Focus</Label>
              <Select
                value={formData.focus}
                onValueChange={(value) => handleInputChange('focus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {COACHING_FOCUS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range (per session)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min £"
                value={formData.priceMin || ''}
                onChange={(e) => handleInputChange('priceMin', parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                placeholder="Max £"
                value={formData.priceMax || ''}
                onChange={(e) => handleInputChange('priceMax', parseInt(e.target.value) || 200)}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sharing Options
            </Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shareVideo"
                  checked={formData.shareVideo}
                  onCheckedChange={(checked) => handleInputChange('shareVideo', checked)}
                />
                <Label htmlFor="shareVideo" className="text-sm">
                  Share my video with selected coaches
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shareAnalysisText"
                  checked={formData.shareAnalysisText}
                  onCheckedChange={(checked) => handleInputChange('shareAnalysisText', checked)}
                />
                <Label htmlFor="shareAnalysisText" className="text-sm">
                  Share my AI analysis with selected coaches
                </Label>
              </div>
            </div>

            {(formData.shareVideo || formData.shareAnalysisText) && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstNameOnly"
                      checked={formData.firstNameOnly}
                      onCheckedChange={(checked) => handleInputChange('firstNameOnly', checked)}
                    />
                    <Label htmlFor="firstNameOnly" className="text-sm">
                      Hide my full name (share first name only)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maskLocation"
                      checked={formData.maskPreciseLocation}
                      onCheckedChange={(checked) => handleInputChange('maskPreciseLocation', checked)}
                    />
                    <Label htmlFor="maskLocation" className="text-sm">
                      Mask location to city/region only
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={formData.consentGiven}
                    onCheckedChange={(checked) => handleInputChange('consentGiven', checked)}
                  />
                  <Label htmlFor="consent" className="text-sm">
                    I agree to share my swing video and AI analysis with selected coaches so they can contact me.
                  </Label>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleFindCoaches}
              disabled={!isFormValid() || isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Find Coaches
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};