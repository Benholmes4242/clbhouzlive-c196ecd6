/**
 * TripsTab - Shows user's trips
 * V2: Matches Games tab layout with NEXT UP hero + UPCOMING sections
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TripCard } from './TripCard';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonLoader';
import { useUserTripsByStatus, type UserTrip } from '../../hooks/useUserGamesTrips';

interface TripsTabProps {
  searchQuery: string;
  onCreateTrip: () => void;
  onClose: () => void;
}

export function TripsTab({ searchQuery, onCreateTrip, onClose }: TripsTabProps) {
  const navigate = useNavigate();
  const { upcomingTrips, pastTrips, isLoading } = useUserTripsByStatus();

  // Filter by search
  const filteredUpcoming = React.useMemo(() => {
    if (!searchQuery.trim()) return upcomingTrips;
    const q = searchQuery.toLowerCase();
    return upcomingTrips.filter(t => t.name.toLowerCase().includes(q));
  }, [upcomingTrips, searchQuery]);

  const filteredPast = React.useMemo(() => {
    if (!searchQuery.trim()) return pastTrips;
    const q = searchQuery.toLowerCase();
    return pastTrips.filter(t => t.name.toLowerCase().includes(q));
  }, [pastTrips, searchQuery]);

  const handleTripTap = (trip: UserTrip) => {
    onClose();
    navigate(`/hub/trip/${trip.id}?tab=timeline`);
  };

  if (isLoading) {
    return <SkeletonList includeHero />;
  }

  const hasAnyTrips = filteredUpcoming.length > 0 || filteredPast.length > 0;

  if (!hasAnyTrips) {
    return <EmptyState tab="trips" onCreateTrip={onCreateTrip} />;
  }

  const nextUp = filteredUpcoming[0];
  const upcomingList = filteredUpcoming.slice(1);

  return (
    <div className="space-y-5">
      {/* Next Up section - hero card for nearest upcoming trip */}
      {nextUp && (
        <div>
          <h4 
            className="text-[10px] font-semibold uppercase tracking-wider mb-3 px-0.5"
            style={{ color: 'rgba(100, 116, 139, 0.5)' }}
          >
            Next Up
          </h4>
          <TripCard
            trip={nextUp}
            variant="hero"
            onTap={() => handleTripTap(nextUp)}
          />
        </div>
      )}

      {/* Upcoming list */}
      {upcomingList.length > 0 && (
        <div>
          <h4 
            className="text-[10px] font-semibold uppercase tracking-wider mb-3 px-0.5"
            style={{ color: 'rgba(100, 116, 139, 0.5)' }}
          >
            Upcoming
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {upcomingList.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TripCard
                    trip={trip}
                    variant="row"
                    onTap={() => handleTripTap(trip)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Past trips section */}
      {filteredPast.length > 0 && (
        <div>
          <h4 
            className="text-[10px] font-semibold uppercase tracking-wider mb-3 px-0.5"
            style={{ color: 'rgba(100, 116, 139, 0.5)' }}
          >
            Past
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {filteredPast.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TripCard
                    trip={trip}
                    variant="row"
                    onTap={() => handleTripTap(trip)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
