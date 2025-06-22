
export interface RankingEntry {
  position: number;
  name: string;
  points?: number;
  country: string;
  change: number;
  school?: string;
}

export interface RankingList {
  id: string;
  name: string;
  tour: string;
  category: 'men' | 'women';
  rankings: RankingEntry[];
  icon: React.ReactNode;
}
