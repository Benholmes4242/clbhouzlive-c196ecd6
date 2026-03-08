import { FriendsCardSkeleton } from './FriendsCardSkeleton';

export function FriendsFeedSkeleton() {
  return (
    <div className="flex flex-col pb-4 pt-2">
      <FriendsCardSkeleton variant="landscape" />
      <FriendsCardSkeleton variant="portrait" />
      <FriendsCardSkeleton variant="landscape" />
    </div>
  );
}
