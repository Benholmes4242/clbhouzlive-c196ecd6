import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnhancedHandicapLayout from './handicap/EnhancedHandicapLayout';
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

  // Use enhanced layout for all users with official handicaps
  const hasOfficialHandicap = (handicapIndex !== null && handicapIndex !== undefined) && 
                              currentProfile?.handicap_governing_body;

  if (hasOfficialHandicap) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <EnhancedHandicapLayout 
          handicapIndex={handicapIndex}
          homeClub={currentProfile?.home_club || 'Unknown Club'}
          governingBody={currentProfile?.handicap_governing_body || 'England Golf'}
          lastUpdated={lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Today'}
        />
      </div>
    );
  }

  // For profiles with no handicap set
  if (handicapIndex === null || handicapIndex === undefined) {
    // If viewing own profile, show connection options
    if (isOwnProfile) {
      return (
        <>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">My Handicap Index®</h3>
            <p className="text-gray-500 mb-4">Connect your handicap to showcase your skill level</p>
            <div className="space-y-3">
              <button 
                onClick={() => setConnectModalOpen(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium"
              >
                Connect Official Handicap
              </button>
              <button 
                onClick={() => setManualModalOpen(true)}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded"
              >
                Manually Input Handicap
              </button>
            </div>
          </div>
          
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
    } else {
      // If viewing someone else's profile with no handicap, show nothing or a simple message
      return (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-2">Handicap Index®</h3>
          <p className="text-gray-500">No handicap information available</p>
        </div>
      );
    }
  }

  // For profiles with handicap set - show the same layout regardless of who's viewing
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
          onEdit={isOwnProfile ? () => setManualModalOpen(true) : () => {}}
          showEditButton={isOwnProfile}
        />
        
        {isOwnProfile && (
          <ManualHandicapModal
            open={manualModalOpen}
            onOpenChange={setManualModalOpen}
            onSave={handleManualSave}
            initialData={{
              handicapIndex,
              homeClub: currentProfile?.home_club || ''
            }}
          />
        )}
      </>
    );
  }

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

      toast.success("Official handicap connected successfully");
    } catch (error) {
      console.error('Error connecting handicap:', error);
      toast.error("Failed to connect handicap. Please try again.");
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

      toast.success("Handicap saved successfully");
    } catch (error) {
      console.error('Error saving handicap:', error);
      toast.error("Failed to save handicap. Please try again.");
    }
  }
};

export default HandicapCard;
