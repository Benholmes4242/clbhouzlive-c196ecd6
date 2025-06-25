import React from 'react';
import { Trophy, Target, Globe, GraduationCap } from 'lucide-react';
import { RankingList } from './types';

export const mockRankings: RankingList[] = [
  {
    id: 'pga',
    name: 'PGA Tour Official World Golf Ranking',
    tour: 'PGA Tour',
    category: 'men',
    icon: <Trophy className="h-4 w-4" />,
    rankings: [
      { position: 1, name: 'Scottie Scheffler', points: 754.865, country: 'USA', change: 0 },
      { position: 2, name: 'Rory McIlroy', points: 511.054, country: 'NIR', change: 0 },
      { position: 3, name: 'Xander Schauffele', points: 287.28, country: 'USA', change: 0 },
      { position: 4, name: 'Justin Thomas', points: 269.824, country: 'USA', change: 1 },
      { position: 5, name: 'Collin Morikawa', points: 249.671, country: 'USA', change: -1 },
      { position: 6, name: 'Russell Henley', points: 242.028, country: 'USA', change: 0 },
      { position: 7, name: 'Keegan Bradley', points: 225.081, country: 'USA', change: 14 },
      { position: 8, name: 'J.J. Spaun', points: 253.9, country: 'USA', change: 0 },
      { position: 9, name: 'Sepp Straka', points: 247.363, country: 'AUT', change: -2 },
      { position: 10, name: 'Viktor Hovland', points: 188.364, country: 'NOR', change: -1 },
      { position: 11, name: 'Ludvig Åberg', points: 228.99, country: 'SWE', change: 1 },
      { position: 12, name: 'Hideki Matsuyama', points: 212.843, country: 'JPN', change: -1 },
      { position: 13, name: 'Tommy Fleetwood', points: 227.682, country: 'ENG', change: 4 },
      { position: 14, name: 'Robert MacIntyre', points: 226.463, country: 'SCO', change: -2 },
      { position: 15, name: 'Bryson DeChambeau', points: 168.727, country: 'USA', change: -2 },
      { position: 16, name: 'Maverick McNealy', points: 192.996, country: 'USA', change: -2 },
      { position: 17, name: 'Ben Griffin', points: 206.859, country: 'USA', change: -2 },
      { position: 18, name: 'Shane Lowry', points: 191.61, country: 'IRL', change: -2 },
      { position: 19, name: 'Harris English', points: 176.638, country: 'USA', change: 3 },
      { position: 20, name: 'Patrick Cantlay', points: 143.599, country: 'USA', change: 0 },
      { position: 21, name: 'Tyrrell Hatton', points: 139.391, country: 'ENG', change: -3 },
      { position: 22, name: 'Sam Burns', points: 163.343, country: 'USA', change: -3 },
      { position: 23, name: 'Corey Conners', points: 147.87, country: 'CAN', change: 1 },
      { position: 24, name: 'Justin Rose', points: 146.021, country: 'ENG', change: -1 },
      { position: 25, name: 'Sungjae Im', points: 158.843, country: 'KOR', change: 0 },
      { position: 26, name: 'Billy Horschel', points: 137.854, country: 'USA', change: 0 },
      { position: 27, name: 'Brian Harman', points: 152.246, country: 'USA', change: 1 },
      { position: 28, name: 'Jason Day', points: 116.773, country: 'AUS', change: 10 },
      { position: 29, name: 'Wyndham Clark', points: 133.855, country: 'USA', change: -2 },
      { position: 30, name: 'Ryan Fox', points: 144.654, country: 'NZL', change: 0 },
      { position: 31, name: 'Daniel Berger', points: 117.331, country: 'USA', change: -2 },
      { position: 32, name: 'Nick Taylor', points: 141.388, country: 'CAN', change: -1 },
      { position: 33, name: 'Aaron Rai', points: 140.654, country: 'ENG', change: -1 },
      { position: 34, name: 'Andrew Novak', points: 135.808, country: 'USA', change: 1 },
      { position: 35, name: 'Thomas Detry', points: 135.461, country: 'BEL', change: -2 },
      { position: 36, name: 'Akshay Bhatia', points: 134.848, country: 'USA', change: -2 },
      { position: 37, name: 'Taylor Pendrith', points: 134.569, country: 'CAN', change: 0 },
      { position: 38, name: 'Min Woo Lee', points: 129.981, country: 'AUS', change: -2 },
      { position: 39, name: 'Cameron Young', points: 121.705, country: 'USA', change: 0 },
      { position: 40, name: 'Adam Scott', points: 118.972, country: 'AUS', change: 0 },
      { position: 41, name: 'J.T. Poston', points: 127.25, country: 'USA', change: 0 },
      { position: 42, name: 'Sahith Theegala', points: 119.734, country: 'USA', change: 0 },
      { position: 43, name: 'Denny McCarthy', points: 110.43, country: 'USA', change: 2 },
      { position: 44, name: 'Tony Finau', points: 107.843, country: 'USA', change: 1 },
      { position: 45, name: 'Lucas Glover', points: 121.621, country: 'USA', change: 3 },
      { position: 46, name: 'Byeong Hun An', points: 114.154, country: 'KOR', change: 3 },
      { position: 47, name: 'Jordan Spieth', points: 99.821, country: 'USA', change: -3 },
      { position: 48, name: 'Max Greyserman', points: 117.51, country: 'USA', change: -2 },
      { position: 49, name: 'Tom Hoge', points: 115.819, country: 'USA', change: -2 },
      { position: 50, name: 'Jhonattan Vegas', points: 86.46, country: 'VEN', change: 1 }
    ]
  },
  {
    id: 'liv',
    name: 'LIV Golf Individual Standings',
    tour: 'LIV Golf',
    category: 'men',
    icon: <Target className="h-4 w-4" />,
    rankings: [
      { position: 1, name: 'Joaquin Niemann', points: 180.5, country: 'CHI', change: 2 },
      { position: 2, name: 'Jon Rahm', points: 173.83, country: 'ESP', change: -1 },
      { position: 3, name: 'Sergio Garcia', points: 133, country: 'ESP', change: 1 },
      { position: 4, name: 'Tyrrell Hatton', points: 126.33, country: 'ENG', change: -2 },
      { position: 5, name: 'Carlos Ortiz', points: 118.33, country: 'MEX', change: 0 },
      { position: 6, name: 'Bryson DeChambeau', points: 115.83, country: 'USA', change: 1 },
      { position: 7, name: 'Cameron Smith', points: 109.5, country: 'AUS', change: -1 },
      { position: 8, name: 'Paul Casey', points: 104.83, country: 'ENG', change: 0 },
      { position: 9, name: 'Talor Gooch', points: 102.83, country: 'USA', change: 3 },
      { position: 10, name: 'Brooks Koepka', points: 99.83, country: 'USA', change: -1 }
    ]
  },
  {
    id: 'dpworld',
    name: 'DP World Tour Race to Dubai',
    tour: 'DP World Tour',
    category: 'men',
    icon: <Globe className="h-4 w-4" />,
    rankings: [
      { position: 1, name: 'Rory McIlroy', points: 3011.17, country: 'NIR', change: 0 },
      { position: 2, name: 'Tyrrell Hatton', points: 2347.29, country: 'ENG', change: 1 },
      { position: 3, name: 'Tommy Fleetwood', points: 2223.4, country: 'ENG', change: -1 },
      { position: 4, name: 'Robert MacIntyre', points: 2104.64, country: 'SCO', change: 2 },
      { position: 5, name: 'Matteo Manassero', points: 1891.45, country: 'ITA', change: 0 },
      { position: 6, name: 'Shane Lowry', points: 1802.17, country: 'IRL', change: -2 },
      { position: 7, name: 'Rasmus Højgaard', points: 1673.58, country: 'DEN', change: 1 },
      { position: 8, name: 'Thriston Lawrence', points: 1669.18, country: 'RSA', change: -1 },
      { position: 9, name: 'Jordan Smith', points: 1499.27, country: 'ENG', change: 0 },
      { position: 10, name: 'Matt Wallace', points: 1425.63, country: 'ENG', change: 1 }
    ]
  },
  {
    id: 'university',
    name: 'Golfstat University Rankings',
    tour: 'University',
    category: 'men',
    icon: <GraduationCap className="h-4 w-4" />,
    rankings: [
      { position: 1, name: 'Gordon Sargent', country: 'USA', change: 0, school: 'Vanderbilt University' },
      { position: 2, name: 'Ben James', country: 'USA', change: 1, school: 'Virginia Tech' },
      { position: 3, name: 'Jackson Koivun', country: 'USA', change: -1, school: 'Auburn University' },
      { position: 4, name: 'Nick Dunlap', country: 'USA', change: 2, school: 'University of Alabama' },
      { position: 5, name: 'Caleb Surratt', country: 'USA', change: -1, school: 'University of Tennessee' },
      { position: 6, name: 'Preston Summerhays', country: 'USA', change: 0, school: 'Arizona State University' },
      { position: 7, name: 'Ludvig Åberg', country: 'SWE', change: 1, school: 'Texas Tech University' },
      { position: 8, name: 'Michael Thorbjornsen', country: 'USA', change: -2, school: 'Stanford University' },
      { position: 9, name: 'William Mouw', country: 'USA', change: 0, school: 'Pepperdine University' },
      { position: 10, name: 'Jacob Bridgeman', country: 'USA', change: 1, school: 'Clemson University' }
    ]
  }
];

export const tourLogos: Record<string, string> = {
  'PGA Tour': 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=200&h=100&fit=crop&auto=format',
  'LIV Golf': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=100&fit=crop&auto=format',
  'DP World Tour': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=200&h=100&fit=crop&auto=format',
  'University': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=100&fit=crop&auto=format'
};

export const universityLogos: Record<string, string> = {
  'Vanderbilt University': 'https://images.unsplash.com/photo-1562774053-701939374585?w=50&h=50&fit=crop&auto=format',
  'Virginia Tech': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=50&h=50&fit=crop&auto=format',
  'Auburn University': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop&auto=format',
  'University of Alabama': 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=50&h=50&fit=crop&auto=format',
  'University of Tennessee': 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=50&h=50&fit=crop&auto=format',
  'Arizona State University': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=50&h=50&fit=crop&auto=format',
  'Texas Tech University': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=50&h=50&fit=crop&auto=format',
  'Stanford University': 'https://images.unsplash.com/photo-1562774053-701939374585?w=50&h=50&fit=crop&auto=format',
  'Pepperdine University': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=50&h=50&fit=crop&auto=format',
  'Clemson University': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=50&h=50&fit=crop&auto=format'
};
