import React, { useState } from 'react';
import { Play, UserPlus, Shuffle, Filter, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

// Mock data for different content types
const featuredMoment = {
  id: '1',
  title: 'Incredible hole-in-one at Pebble Beach',
  user: 'ProGolfer_Mike',
  timeAgo: '2 hours ago',
  image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
  type: 'video',
  duration: '0:45'
};

const courseHighlights = [
  { id: '1', name: 'Augusta National', location: 'Georgia, USA', posts: 247, image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=300&h=200&fit=crop' },
  { id: '2', name: 'St. Andrews', location: 'Scotland', posts: 189, image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=300&h=200&fit=crop' },
  { id: '3', name: 'Pebble Beach', location: 'California, USA', posts: 156, image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop' },
];

const topPlayers = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    bio: '2 HCP • Teaching Pro', 
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2f6bb44?w=100&h=100&fit=crop',
    preview: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=200&h=150&fit=crop'
  },
  { 
    id: '2', 
    name: 'Marcus Rodriguez', 
    bio: '5 HCP • Course Designer', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    preview: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=200&h=150&fit=crop'
  },
];

const trendingTips = [
  { id: '1', title: 'Perfect your putting stance', tag: 'Putting', user: 'CoachJim', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=250&h=200&fit=crop', type: 'video' },
  { id: '2', title: 'Driver distance secrets', tag: 'Driving', user: 'LongDrive_Pro', image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=250&h=200&fit=crop', type: 'image' },
  { id: '3', title: 'Bunker escape technique', tag: 'BunkerPlay', user: 'SandMaster', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=250&h=200&fit=crop', type: 'video' },
];

const clubSpotlight = [
  { 
    id: '1', 
    name: 'Pine Valley Golf Academy', 
    logo: 'https://images.unsplash.com/photo-1556909114-6c3bd9b1b689?w=80&h=80&fit=crop',
    post: 'New summer training programs available',
    image: 'https://images.unsplash.com/photo-1556909114-f6e34c7aec6b?w=300&h=200&fit=crop'
  },
];

const ClubhouseFeed = () => {
  const [feedType, setFeedType] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [contentFilter, setContentFilter] = useState('all');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Clubhouse Feed</h1>
          <p className="text-muted-foreground">Discover golf content from the community</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button 
              variant={feedType === 'all' ? 'default' : 'outline'} 
              onClick={() => setFeedType('all')}
              size="sm"
            >
              From All
            </Button>
            <Button 
              variant={feedType === 'friends' ? 'default' : 'outline'} 
              onClick={() => setFeedType('friends')}
              size="sm"
            >
              From Friends
            </Button>
          </div>
          
          <div className="flex gap-2 flex-1">
            <Select value={contentFilter} onValueChange={setContentFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="tip">Tips</SelectItem>
                <SelectItem value="profile">Profiles</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Shuffle className="h-4 w-4 mr-2" />
              Surprise Me
            </Button>
          </div>
        </div>

        {/* Featured Moment */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Featured Moment</h2>
          <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border">
            <img src={featuredMoment.image} alt={featuredMoment.title} className="w-full h-64 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {featuredMoment.type === 'video' && (
              <>
                <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {featuredMoment.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play className="h-8 w-8 text-white fill-current" />
                  </div>
                </div>
              </>
            )}
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold mb-1">{featuredMoment.title}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span>@{featuredMoment.user}</span>
                <Clock className="h-3 w-3" />
                <span>{featuredMoment.timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Highlights */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Course Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courseHighlights.map((course) => (
              <div key={course.id} className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <img src={course.image} alt={course.name} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{course.name}</h3>
                  <div className="flex items-center text-muted-foreground text-sm mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    {course.location}
                  </div>
                  <Badge variant="secondary">{course.posts} posts</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Player Content */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Player Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPlayers.map((player) => (
              <div key={player.id} className="bg-card rounded-lg p-4 shadow-sm border">
                <div className="flex items-start gap-4">
                  <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{player.bio}</p>
                    <img src={player.preview} alt="Preview" className="w-full h-24 object-cover rounded mb-3" />
                    <Button size="sm" className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Tips */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Trending Tips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTips.map((tip) => (
              <div key={tip.id} className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative">
                  <img src={tip.image} alt={tip.title} className="w-full h-40 object-cover" />
                  {tip.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-2">
                        <Play className="h-4 w-4 text-white fill-current" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2">#{tip.tag}</Badge>
                  <h3 className="font-semibold mb-1">{tip.title}</h3>
                  <p className="text-muted-foreground text-sm">@{tip.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Club & Business Spotlight */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Club & Business Spotlight</h2>
          {clubSpotlight.map((club) => (
            <div key={club.id} className="bg-card rounded-lg overflow-hidden shadow-sm border">
              <img src={club.image} alt={club.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="font-semibold">{club.name}</h3>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">{club.post}</p>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
