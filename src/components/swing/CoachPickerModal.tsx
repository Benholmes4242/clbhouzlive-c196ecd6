import React, { useState, useEffect } from 'react';
import { X, Search, Filter, MapPin, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CoachProfile, ShareConsentOptions } from '@/types/coach';
import { SwingShareService } from '@/services/swing/share';
import { CoachCard } from './CoachCard';

interface CoachPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  onShareComplete: (shareId: string) => void;
}

export const CoachPickerModal: React.FC<CoachPickerModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  onShareComplete
}) => {
  const [step, setStep] = useState<'search' | 'consent'>('search');
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [radiusKm, setRadiusKm] = useState([25]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [consent, setConsent] = useState<ShareConsentOptions>({
    shareVideo: true,
    shareVisuals: true,
    shareAnalysis: true,
    shareContact: false
  });
  const { toast } = useToast();

  const availableSpecialties = SwingShareService.getAvailableSpecialties();

  useEffect(() => {
    if (isOpen && step === 'search') {
      searchCoaches();
    }
  }, [isOpen]);

  const searchCoaches = async () => {
    setLoading(true);
    try {
      // Extract region code from postcode (simplified)
      const regionCode = postcode ? postcode.substring(0, 2).toUpperCase() : undefined;
      
      const results = await SwingShareService.searchCoaches({
        regionCode,
        radiusKm: radiusKm[0],
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined
      });
      
      setCoaches(results);
    } catch (error) {
      console.error('Error searching coaches:', error);
      toast({
        title: "Search failed",
        description: "Could not search for coaches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleCoachSelect = (coach: CoachProfile) => {
    setSelectedCoach(coach);
  };

  const proceedToConsent = () => {
    if (!selectedCoach) {
      toast({
        title: "No coach selected",
        description: "Please select a coach to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep('consent');
  };

  const handleShare = async () => {
    if (!selectedCoach) return;

    setLoading(true);
    try {
      const share = await SwingShareService.shareWithCoach(
        analysisId,
        selectedCoach.id,
        consent
      );

      toast({
        title: "Shared with coach",
        description: `Your swing analysis has been sent to ${selectedCoach.name}. They'll review it and get back to you.`
      });

      onShareComplete(share.id);
      onClose();
    } catch (error) {
      console.error('Error sharing with coach:', error);
      toast({
        title: "Share failed",
        description: "Could not share with coach. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'consent') {
      setStep('search');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'search' ? (
              <>
                <Search className="h-5 w-5" />
                Find a Local Coach
              </>
            ) : (
              <>
                <Filter className="h-5 w-5" />
                Sharing Preferences
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="e.g. SE1 9RT"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Distance: {radiusKm[0]} km</Label>
                <Slider
                  value={radiusKm}
                  onValueChange={setRadiusKm}
                  max={100}
                  min={5}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Button 
                  onClick={searchCoaches} 
                  disabled={loading}
                  className="w-full mt-6"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Specialties Filter */}
            <div>
              <Label className="mb-2 block">Specialties</Label>
              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSpecialtyToggle(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : coaches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coaches.map((coach) => (
                    <CoachCard
                      key={coach.id}
                      coach={coach}
                      onSelect={handleCoachSelect}
                      isSelected={selectedCoach?.id === coach.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No coaches found in your area</p>
                  <p className="text-sm">Try expanding your search radius</p>
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={proceedToConsent} 
                disabled={!selectedCoach}
              >
                Continue with {selectedCoach?.name || 'Selected Coach'}
              </Button>
            </div>
          </div>
        )}

        {step === 'consent' && selectedCoach && (
          <div className="space-y-6">
            {/* Selected Coach Summary */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Sharing with {selectedCoach.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedCoach.bio}</p>
            </div>

            {/* Consent Options */}
            <div className="space-y-4">
              <h4 className="font-medium">What would you like to share?</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareVideo"
                    checked={consent.shareVideo}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, shareVideo: !!checked }))
                    }
                  />
                  <Label htmlFor="shareVideo" className="text-sm">
                    Share swing video
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareVisuals"
                    checked={consent.shareVisuals}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, shareVisuals: !!checked }))
                    }
                  />
                  <Label htmlFor="shareVisuals" className="text-sm">
                    Share visual analysis images
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareAnalysis"
                    checked={consent.shareAnalysis}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, shareAnalysis: !!checked }))
                    }
                  />
                  <Label htmlFor="shareAnalysis" className="text-sm">
                    Share AI analysis text
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareContact"
                    checked={consent.shareContact}
                    onCheckedChange={(checked) => 
                      setConsent(prev => ({ ...prev, shareContact: !!checked }))
                    }
                  />
                  <Label htmlFor="shareContact" className="text-sm">
                    Share my contact information
                  </Label>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
                <p>• Your data will be shared securely via time-limited links</p>
                <p>• The coach will have 7 days to review your analysis</p>
                <p>• You'll be notified when they provide feedback</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleShare} 
                disabled={loading || (!consent.shareVideo && !consent.shareVisuals && !consent.shareAnalysis)}
              >
                {loading ? 'Sharing...' : 'Share for Review'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};