
export type StoryUser = {
  id: string;
  type?: 'add' | 'friend' | 'suggested';
  user: string;
  username: string;
  avatar: string;
  hasStory?: boolean;
  display_name?: string;
  homeClub?: string;
};
