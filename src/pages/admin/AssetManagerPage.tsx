import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, GraduationCap, Flag, Trophy } from 'lucide-react';
import { countryToFlagCode } from '@/utils/countryFlags';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AssetManagerHeader,
  BrandLogosTab,
  CollegeLogosTab,
  CountryFlagsTab,
  TourLogosTab,
} from '@/components/admin/assets';

export function AssetManagerPage() {
  const [activeTab, setActiveTab] = useState('brand-logos');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Fetch brand logos
  const { data: logos = [], isLoading: logosLoading, refetch: refetchLogos } = useQuery({
    queryKey: ['admin-logos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch college logos
  const { data: colleges = [], isLoading: collegesLoading, refetch: refetchColleges } = useQuery({
    queryKey: ['admin-college-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('college_media')
        .select('*')
        .order('college_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Get tour logos (subset of brand logos)
  const tourLogos = logos.filter(l => l.category === 'golf_tours');

  // Stats
  const stats = {
    logos: logos.length,
    collegeLogos: colleges.filter(c => c.logo_url).length,
    countryFlags: Object.keys(countryToFlagCode).length,
    tourLogos: tourLogos.length,
  };

  const handleUploadClick = () => {
    // Switch to brand logos tab and scroll to upload section
    setActiveTab('brand-logos');
    // Could also open a dialog here
  };

  return (
    <div className="space-y-6">
      <AssetManagerHeader
        stats={stats}
        onUploadClick={handleUploadClick}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brand-logos" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Brand Logos</span>
            <span className="sm:hidden">Brands</span>
          </TabsTrigger>
          <TabsTrigger value="college-logos" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">College Logos</span>
            <span className="sm:hidden">Colleges</span>
          </TabsTrigger>
          <TabsTrigger value="country-flags" className="gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Country Flags</span>
            <span className="sm:hidden">Flags</span>
          </TabsTrigger>
          <TabsTrigger value="tour-logos" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Tour Logos</span>
            <span className="sm:hidden">Tours</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand-logos">
          <BrandLogosTab
            logos={logos}
            isLoading={logosLoading}
            onRefresh={refetchLogos}
          />
        </TabsContent>

        <TabsContent value="college-logos">
          <CollegeLogosTab
            colleges={colleges}
            isLoading={collegesLoading}
            onRefresh={refetchColleges}
          />
        </TabsContent>

        <TabsContent value="country-flags">
          <CountryFlagsTab flagCount={stats.countryFlags} />
        </TabsContent>

        <TabsContent value="tour-logos">
          <TourLogosTab
            tourLogos={tourLogos}
            isLoading={logosLoading}
            onRefresh={refetchLogos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AssetManagerPage;
