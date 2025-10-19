export type MockCreator = {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string;
  home_club?: string | null;
  // mock timing: minutesAgo since last post (0–2000, <=1440 means recent)
  minutesAgo?: number;
  previewPoster?: string;
  previewMp4?: string;
};

export const MOCK_CREATORS: MockCreator[] = [
  { id: 'mk-001', username: 'anna_shaw',   display_name: 'Anna Shaw',   profile_photo_url: 'https://picsum.photos/seed/anna/200/200',   home_club: 'Royal Birkdale',            minutesAgo: 12,  previewPoster: 'https://picsum.photos/seed/anna-p/320/180' },
  { id: 'mk-002', username: 'tom_slice',   display_name: 'Tom "Slice"', profile_photo_url: 'https://picsum.photos/seed/tom/200/200',    home_club: 'Formby',                    minutesAgo: 60,  previewPoster: 'https://picsum.photos/seed/tom-p/320/180'  },
  { id: 'mk-003', username: 'mia_putts',   display_name: 'Mia Putts',   profile_photo_url: 'https://picsum.photos/seed/mia/200/200',    home_club: 'Wallasey',                  minutesAgo: 1500,previewPoster: 'https://picsum.photos/seed/mia-p/320/180'  },
  { id: 'mk-004', username: 'dan_draw',    display_name: 'Dan Draw',    profile_photo_url: 'https://picsum.photos/seed/dan/200/200',    home_club: 'Hillside',                  minutesAgo: 5,   previewPoster: 'https://picsum.photos/seed/dan-p/320/180'  },
  { id: 'mk-005', username: 'liz_loft',    display_name: 'Liz Loft',    profile_photo_url: 'https://picsum.photos/seed/liz/200/200',    home_club: 'Southport & Ainsdale',      minutesAgo: 20,  previewPoster: 'https://picsum.photos/seed/liz-p/320/180'  },
  { id: 'mk-006', username: 'ben_holmes',  display_name: 'Ben Holmes',  profile_photo_url: 'https://picsum.photos/seed/ben/200/200',    home_club: 'Royal Liverpool',           minutesAgo: 999, previewPoster: 'https://picsum.photos/seed/ben-p/320/180'  },
  { id: 'mk-007', username: 'zoe_chip',    display_name: 'Zoe Chip',    profile_photo_url: 'https://picsum.photos/seed/zoe/200/200',    home_club: 'St Andrews',                minutesAgo: 2,   previewPoster: 'https://picsum.photos/seed/zoe-p/320/180'  },
  { id: 'mk-008', username: 'ryan_hook',   display_name: 'Ryan Hook',   profile_photo_url: 'https://picsum.photos/seed/ryan/200/200',   home_club: 'Sunningdale',               minutesAgo: 3000,previewPoster: 'https://picsum.photos/seed/ryan-p/320/180' },
];

export const MOCK_NEARBY = [
  { id: 'nb-001', username: 'local_amy', display_name: 'Amy Local', profile_photo_url: 'https://picsum.photos/seed/amy/200/200', home_club: 'Royal Birkdale' },
  { id: 'nb-002', username: 'local_max', display_name: 'Max Local', profile_photo_url: 'https://picsum.photos/seed/max/200/200', home_club: 'Formby' },
  { id: 'nb-003', username: 'local_lee', display_name: 'Lee Local', profile_photo_url: 'https://picsum.photos/seed/lee/200/200', home_club: 'Hillside' },
  { id: 'nb-004', username: 'local_ava', display_name: 'Ava Local', profile_photo_url: 'https://picsum.photos/seed/ava/200/200', home_club: 'Wallasey' },
  { id: 'nb-005', username: 'local_jai', display_name: 'Jai Local', profile_photo_url: 'https://picsum.photos/seed/jai/200/200', home_club: 'Formby Hall' },
];
