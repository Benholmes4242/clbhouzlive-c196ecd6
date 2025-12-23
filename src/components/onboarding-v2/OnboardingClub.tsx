import React, { useState, useEffect } from 'react';
import { Search, Check, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { AuthPrimaryButton, AuthSecondaryButton } from '@/components/auth-v2';
import type { OnboardingData } from '@/pages/OnboardingV2';

interface OnboardingClubProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveProgress: (updates: Partial<OnboardingData>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

interface Club {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
}

/**
 * B3 - Home Club Step
 * Search for club with country context
 */
const OnboardingClub: React.FC<OnboardingClubProps> = ({
  data,
  updateData,
  saveProgress,
  onNext,
}) => {
  const [search, setSearch] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [noHomeClub, setNoHomeClub] = useState(!data.hasHomeClub);

  // Search clubs with debounce
  useEffect(() => {
    if (!search.trim() || noHomeClub) {
      setClubs([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('golf_courses')
          .select('id, name, region, country')
          .ilike('name', `%${search}%`)
          .limit(25);

        // Filter by country if available
        if (data.countryName) {
          query = query.eq('country', data.countryName);
        }

        const { data: results } = await query;
        setClubs((results as Club[]) || []);
      } catch (err) {
        console.error('Error searching clubs:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [search, data.countryName, noHomeClub]);

  const handleSelectClub = (club: Club) => {
    updateData({
      homeClubId: club.id,
      homeClubName: club.name,
      hasHomeClub: true,
    });
    setNoHomeClub(false);
  };

  const handleNoHomeClub = () => {
    setNoHomeClub(true);
    updateData({
      homeClubId: null,
      homeClubName: null,
      hasHomeClub: false,
    });
  };

  const handleNext = async () => {
    await saveProgress({
      homeClubId: data.homeClubId,
      homeClubName: data.homeClubName,
    });
    onNext();
  };

  const canContinue = noHomeClub || !!data.homeClubId;

  return (
    <div className="flex-1 flex flex-col px-6 pt-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Select your home club
        </h1>
        <p className="text-white/50">
          Your primary golf club. You can add more later.
        </p>
      </div>

      {/* No home club option */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleNoHomeClub}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-colors mb-4 ${
          noHomeClub
            ? 'bg-white/10 border-white/30'
            : 'bg-transparent border-white/10 hover:border-white/20'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white/60" />
        </div>
        <span className="flex-1 text-left text-white">I don't have a home club</span>
        {noHomeClub && <Check className="w-5 h-5 text-green-400" />}
      </motion.button>

      {!noHomeClub && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search clubs by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
            />
            {data.countryName && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">
                {data.countryName}
              </span>
            )}
          </div>

          {/* Selected club display */}
          {data.homeClubId && data.homeClubName && (
            <div className="mb-4 p-4 bg-white/10 rounded-xl border border-white/20">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">{data.homeClubName}</p>
                  <p className="text-white/50 text-sm">Selected as home club</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              </div>
            ) : clubs.length > 0 ? (
              <div className="space-y-1">
                {clubs.map((club) => (
                  <motion.button
                    key={club.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectClub(club)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      data.homeClubId === club.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <p className="text-white">{club.name}</p>
                      {club.region && (
                        <p className="text-white/50 text-sm">{club.region}</p>
                      )}
                    </div>
                    {data.homeClubId === club.id && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            ) : search.trim() ? (
              <div className="py-8 text-center">
                <p className="text-white/50">No clubs found. Try searching by town or club name.</p>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* CTA */}
      <div className="py-6 space-y-3">
        <AuthPrimaryButton onClick={handleNext} disabled={!canContinue}>
          Next
        </AuthPrimaryButton>
        
        {!noHomeClub && !data.homeClubId && (
          <AuthSecondaryButton onClick={handleNext}>
            Skip for now
          </AuthSecondaryButton>
        )}
      </div>
    </div>
  );
};

export default OnboardingClub;
