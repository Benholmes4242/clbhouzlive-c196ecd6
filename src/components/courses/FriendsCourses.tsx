
import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import FriendSelector from './friends/FriendSelector';
import FriendStatistics from './friends/FriendStatistics';
import FriendCourseTabs from './friends/FriendCourseTabs';
import EmptyFriendsState from './friends/EmptyFriendsState';
import { useFriendData } from './friends/useFriendData';

const FriendsCourses = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('top100');

  console.log('FriendsCourses: Rendering with user:', user?.id);

  const {
    friends,
    isLoadingFriends,
    friendPlayedCourses,
    friendTop100Courses,
    isLoadingTop100,
    friendAverageRating
  } = useFriendData(user?.id, selectedFriendId);

  console.log('FriendsCourses: Data from useFriendData:', {
    friends: friends.length,
    isLoadingFriends,
    selectedFriendId
  });

  const selectedFriend = friends.find(f => f.friend_id === selectedFriendId);
  const friendName = selectedFriend?.user_profiles?.display_name || selectedFriend?.user_profiles?.username || 'Friend';

  // Calculate statistics
  const totalTop100Played = friendTop100Courses.length;

  // Filter recent courses to only include those played within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = [...friendPlayedCourses, ...friendTop100Courses]
    .filter((userCourse) => {
      if (!userCourse.played_date) return false;
      const playedDate = new Date(userCourse.played_date);
      return playedDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.played_date || 0).getTime() - new Date(a.played_date || 0).getTime())
    .slice(0, 6);

  const handleAverageRatingClick = () => {
    if (selectedFriendId) {
      navigate(`/profile/${selectedFriend?.user_profiles?.username || selectedFriendId}`);
    }
  };

  if (isLoadingFriends) {
    console.log('FriendsCourses: Still loading friends...');
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading your friends...</div>
      </div>
    );
  }

  if (friends.length === 0) {
    console.log('FriendsCourses: No friends found, showing empty state');
    return <EmptyFriendsState />;
  }

  console.log('FriendsCourses: Rendering with friends:', friends.length);

  return (
    <div className="space-y-6">
      <FriendSelector
        friends={friends}
        selectedFriendId={selectedFriendId}
        onFriendSelect={setSelectedFriendId}
      />

      {selectedFriendId && (
        <>
          <FriendStatistics
            friendName={friendName}
            totalTop100Played={totalTop100Played}
            averageRating={friendAverageRating}
            onAverageRatingClick={handleAverageRatingClick}
          />

          <FriendCourseTabs
            friendName={friendName}
            selectedFriendId={selectedFriendId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            friendTop100Courses={friendTop100Courses}
            recentCourses={recentCourses}
            isLoadingTop100={isLoadingTop100}
          />
        </>
      )}
    </div>
  );
};

export default FriendsCourses;
