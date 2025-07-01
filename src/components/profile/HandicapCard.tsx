
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import BenjaminHandicapLayout from './handicap/BenjaminHandicapLayout';
import StandardHandicapCard from './handicap/StandardHandicapCard';
import HandicapConnectModal from './handicap/HandicapConnectModal';
import ManualHandicapModal from './handicap/ManualHandicapModal';
import ManualHandicapCard from './handicap/ManualHandicapCard';
import OfficialHandicapCard from './handicap/OfficialHandicapCard';

interface HandicapCardProps {
  handicapIndex?: number | null;
  egAppConnected: boolean;
  lastUpdated?: string | null;
  trend?: 'up' | 'down' | 'stable';
  isOwnProfile: boolean;
  onEGConnect: () => void;
  userUsername?: string;
  profile?: any;
}

const HandicapCard: React.FC<HandicapCardProps> = ({
  handicapIndex,
  egAppConnected,
  lastUpdated,
  isOwnProfile,
  onEGConnect,
  userUsername,
  profile
}) => {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  // Check if this is Benjamin Holmes' profile
  const isBenjaminHolmes = userUsername === 'benjaminholmes';

  // Render Benjamin's special layout
  if (isBenjaminHolmes && (handicapIndex !== null && handicapIndex !== undefined)) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <BenjaminHandicapLayout />
      </div>
    );
  }

  // For own profile with no handicap set
  if (isOwnProfile && (handicapIndex === null || handicapIndex === undefined)) {
    return (
      <>
        <StandardHandicapCard
          handicapIndex={handicapIndex}
          egAppConnected={egAppConnected}
          lastUpdated={lastUpdated}
          isOwnProfile={isOwnProfile}
          onEGConnect={() => setConnectModalOpen(true)}
          onManualAdd={() => setManualModalOpen(true)}
        />
        
        <HandicapConnectModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
          onConnect={handleOfficialConnect}
        />
        
        <ManualHandicapModal
          open={manualModalOpen}
          onOpenChange={setManualModalOpen}
          onSave={handleManualSave}
        />
      </>
    );
  }

  // For own profile with handicap set
  if (isOwnProfile && (handicapIndex !== null && handicapIndex !== undefined)) {
    const isOfficial = currentProfile?.handicap_governing_body;

    if (isOfficial) {
      return (
        <OfficialHandicapCard
          handicapIndex={handicapIndex}
          homeClub={currentProfile?.home_club || 'Unknown Club'}
          governingBody={currentProfile.handicap_governing_body}
          lastUpdated={lastUpdated || new Date().toISOString()}
        />
      );
    } else {
      return (
        <>
          <ManualHandicapCard
            handicapIndex={handicapIndex}
            homeClub={currentProfile?.home_club || 'Unknown Club'}
            onEdit={() => setManualModalOpen(true)}
          />
          
          <ManualHandicapModal
            open={manualModalOpen}
            onOpenChange={setManualModalOpen}
            onSave={handleManualSave}
            initialData={{
              handicapIndex,
              homeClub: currentProfile?.home_club || ''
            }}
          />
        </>
      );
    }
  }

  // For other users' profiles (viewing someone else)
  return (
    <StandardHandicapCard
      handicapIndex={handicapIndex}
      egAppConnected={egAppConnected}
      lastUpdated={lastUpdated}
      isOwnProfile={isOwnProfile}
      onEGConnect={onEGConnect}
    />
  );

  async function handleOfficialConnect(data: {
    governingBody: string;
    governingBodyId: string;
    handicapIndex: number;
    homeClub: string;
  }) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          eg_handicap_index: data.handicapIndex,
          home_club: data.homeClub,
          handicap_governing_body: data.governingBody,
          handicap_governing_body_id: data.governingBodyId,
          eg_app_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      setCurrentProfile(prev => ({
        ...prev,
        eg_handicap_index: data.handicapIndex,
        home_club: data.homeClub,
        handicap_governing_body: data.governingBody,
        handicap_governing_body_id: data.governingBodyId,
        eg_app_connected: true,
      }));

      toast({
        title: "Success",
        description: "Official handicap connected successfully",
      });
    } catch (error) {
      console.error('Error connecting handicap:', error);
      toast({
        title: "Error",
        description: "Failed to connect handicap. Please try again.",
        variant: "destructive"
      });
    }
  }

  async function handleManualSave(data: {
    handicapIndex: number;
    homeClub: string;
  }) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          eg_handicap_index: data.handicapIndex,
          home_club: data.homeClub,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      setCurrentProfile(prev => ({
        ...prev,
        eg_handicap_index: data.handicapIndex,
        home_club: data.homeClub,
      }));

      toast({
        title: "Success",
        description: "Handicap saved successfully",
      });
    } catch (error) {
      console.error('Error saving handicap:', error);
      toast({
        title: "Error",
        description: "Failed to save handicap. Please try again.",
        variant: "destructive"
      });
    }
  }
};

export default HandicapCard;
