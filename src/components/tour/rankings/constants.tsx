
import React from 'react';
import { Trophy, Medal, GraduationCap, Globe } from 'lucide-react';
import { RankingList } from './types';

// University logo mapping
export const universityLogos: Record<string, string> = {
  'Stanford University': '/lovable-uploads/508bb03c-7a9f-464d-9b09-48939c5e5c53.png',
  'Duke University': '/lovable-uploads/df006b4c-e4aa-49b8-b83e-3d46eba27fdb.png',
  'Oklahoma State': '/lovable-uploads/969e7650-5607-4c02-9a10-ac7a863764a7.png',
  'University of Texas': '/lovable-uploads/6cd6b247-0cdf-4587-b46f-3ed85f18a9ce.png',
  'Auburn University': '/lovable-uploads/7ea42fb3-2543-4f01-8a4e-cfdf2a5fac1a.png',
};

// Tour logo mapping
export const tourLogos: Record<string, string> = {
  'PGA': '/lovable-uploads/40d74a79-f402-4d98-af1d-242a35f993b4.png',
  'LIV': '/lovable-uploads/09ec2e18-35f5-46cb-81a5-9862fe118274.png',
  'DP World': '/lovable-uploads/62b4549e-fa2b-468b-9d6b-680542b8344d.png',
  'University': '/lovable-uploads/6272d8e2-c43e-49e6-ae7b-667db411c2f8.png',
};

export const mockRankings: RankingList[] = [
  {
    id: 'pga-men',
    name: 'PGA Tour Rankings',
    tour: 'PGA',
    category: 'men',
    icon: <Trophy className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'Scottie Scheffler', points: 854, country: 'USA', change: 0 },
      { position: 2, name: 'Jon Rahm', points: 612, country: 'ESP', change: 1 },
      { position: 3, name: 'Rory McIlroy', points: 587, country: 'NIR', change: -1 },
      { position: 4, name: 'Viktor Hovland', points: 523, country: 'NOR', change: 2 },
      { position: 5, name: 'Xander Schauffele', points: 498, country: 'USA', change: 0 },
    ],
  },
  {
    id: 'liv-men',
    name: 'LIV Golf Rankings',
    tour: 'LIV',
    category: 'men',
    icon: <Medal className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'Bryson DeChambeau', points: 342, country: 'USA', change: 1 },
      { position: 2, name: 'Cameron Smith', points: 298, country: 'AUS', change: -1 },
      { position: 3, name: 'Brooks Koepka', points: 276, country: 'USA', change: 0 },
      { position: 4, name: 'Dustin Johnson', points: 254, country: 'USA', change: 1 },
      { position: 5, name: 'Phil Mickelson', points: 231, country: 'USA', change: -1 },
    ],
  },
  {
    id: 'dp-world-men',
    name: 'DP World Tour Rankings',
    tour: 'DP World',
    category: 'men',
    icon: <Globe className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'Rory McIlroy', points: 487, country: 'NIR', change: 0 },
      { position: 2, name: 'Tommy Fleetwood', points: 423, country: 'ENG', change: 1 },
      { position: 3, name: 'Tyrrell Hatton', points: 398, country: 'ENG', change: -1 },
      { position: 4, name: 'Shane Lowry', points: 365, country: 'IRL', change: 2 },
      { position: 5, name: 'Matt Fitzpatrick', points: 341, country: 'ENG', change: 0 },
    ],
  },
  {
    id: 'university-men',
    name: 'US University Rankings',
    tour: 'University',
    category: 'men',
    icon: <GraduationCap className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'John Smith', country: 'USA', change: 0, school: 'Stanford University' },
      { position: 2, name: 'Michael Johnson', country: 'USA', change: 2, school: 'Duke University' },
      { position: 3, name: 'David Wilson', country: 'USA', change: -1, school: 'Oklahoma State' },
      { position: 4, name: 'Robert Davis', country: 'USA', change: 1, school: 'University of Texas' },
      { position: 5, name: 'James Brown', country: 'USA', change: -2, school: 'Auburn University' },
    ],
  },
];
