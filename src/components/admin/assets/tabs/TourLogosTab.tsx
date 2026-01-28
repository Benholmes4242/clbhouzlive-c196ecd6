import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Download, Trash2, Trophy, Grid, List, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tour logos are typically stored in the logos table with category 'golf_tours'
interface TourLogo {
  id: string;
  name: string;
  logo_url: string;
  tour_code?: string;
  hasLogo?: boolean;
}

// Static tour data - in production, this would come from database
const TOURS: TourLogo[] = [
  { id: 'pga', name: 'PGA Tour', logo_url: '/placeholder.svg', tour_code: 'PGA' },
  { id: 'liv', name: 'LIV Golf', logo_url: '/placeholder.svg', tour_code: 'LIV' },
  { id: 'dpw', name: 'DP World Tour', logo_url: '/placeholder.svg', tour_code: 'DPW' },
  { id: 'lpga', name: 'LPGA Tour', logo_url: '/placeholder.svg', tour_code: 'LPGA' },
  { id: 'champions', name: 'Champions Tour', logo_url: '/placeholder.svg', tour_code: 'CHAMP' },
  { id: 'korn', name: 'Korn Ferry Tour', logo_url: '/placeholder.svg', tour_code: 'KFT' },
];

interface TourLogosTabProps {
  tourLogos: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const TourLogosTab: React.FC<TourLogosTabProps> = ({
  tourLogos,
  isLoading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTour, setPreviewTour] = useState<TourLogo | null>(null);

  // Merge database logos with static tour data
  const tours = TOURS.map(tour => {
    const dbLogo = tourLogos.find(l => 
      l.file_name?.toLowerCase().includes(tour.tour_code?.toLowerCase() || '') ||
      l.file_name?.toLowerCase().includes(tour.name.toLowerCase())
    );
    return {
      ...tour,
      logo_url: dbLogo?.file_url || tour.logo_url,
      hasLogo: !!dbLogo,
    };
  });

  const filteredTours = tours.filter(tour =>
    tour.name.toLowerCase().includes(search.toLowerCase()) ||
    tour.tour_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Tour Logos</h3>
              <p className="text-sm text-muted-foreground">
                Professional golf tour logos used throughout the platform. Upload tour logos in the Brand Logos tab with category "Golf Tours".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tours Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTours.map((tour) => (
            <Card 
              key={tour.id} 
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setPreviewTour(tour)}
            >
              <div className="aspect-video bg-muted rounded flex items-center justify-center mb-3 overflow-hidden">
                {tour.hasLogo ? (
                  <img
                    src={tour.logo_url}
                    alt={tour.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{tour.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">{tour.tour_code}</Badge>
                </div>
                {tour.hasLogo ? (
                  <Badge className="bg-green-500/20 text-green-700 text-xs">Active</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">No Logo</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => setPreviewTour(tour)}
              >
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0">
                  {tour.hasLogo ? (
                    <img
                      src={tour.logo_url}
                      alt={tour.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{tour.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">{tour.tour_code}</Badge>
                </div>
                {tour.hasLogo ? (
                  <Badge className="bg-green-500/20 text-green-700">Active</Badge>
                ) : (
                  <Badge variant="outline">No Logo</Badge>
                )}
                {tour.hasLogo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); window.open(tour.logo_url, '_blank'); }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredTours.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tours found matching "{search}"
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTour} onOpenChange={() => setPreviewTour(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewTour?.name}</DialogTitle>
          </DialogHeader>
          {previewTour && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-48 bg-muted rounded flex items-center justify-center p-4">
                {previewTour.hasLogo ? (
                  <img
                    src={previewTour.logo_url}
                    alt={previewTour.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2" />
                    <p>No logo uploaded</p>
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">{previewTour.tour_code}</Badge>
              {previewTour.hasLogo && (
                <Button onClick={() => window.open(previewTour.logo_url, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
