/**
 * TripsTab - Shows user's trips
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { TripCard } from './TripCard';
import { EmptyState } from './EmptyState';
import { SkeletonList } from './SkeletonLoader';
import { useUserTrips, type UserTrip } from '../../hooks/useUserGamesTrips';

interface TripsTabProps {
  searchQuery: string;
  onCreateTrip: () => void;
  onClose: () => void;
}

export function TripsTab({ searchQuery, onCreateTrip, onClose }: TripsTabProps) {
  const navigate = useNavigate();
  const { data: trips, isLoading } = useUserTrips();

  // Filter by search
  const filtered = React.useMemo(() => {
    if (!trips) return [];
    if (!searchQuery.trim()) return trips;
    
    const q = searchQuery.toLowerCase();
    return trips.filter(t => 
      t.name.toLowerCase().includes(q)
    );
  }, [trips, searchQuery]);

  const handleTripTap = (trip: UserTrip) => {
    onClose();
    navigate(`/hub/trip/${trip.id}?tab=timeline`);
  };

  if (isLoading) {
    return <SkeletonList />;
  }

  if (filtered.length === 0) {
    return <EmptyState tab="trips" onCreateTrip={onCreateTrip} />;
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {filtered.map((trip, index) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <TripCard
              trip={trip}
              onTap={() => handleTripTap(trip)}
              onKebabTap={() => {
                // TODO: Open action menu
                console.log('Kebab tapped for trip:', trip.id);
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
