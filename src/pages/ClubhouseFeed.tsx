import React, { useState } from 'react';
import { Play, UserPlus, Shuffle, Filter, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

// Mock data for different content types
const featuredMoments = [
  {
    id: '1',
    title: 'Incredible hole-in-one at Pebble Beach',
    user: 'ProGolfer_Mike',
    timeAgo: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
    type: 'video',
    duration: '0:45'
  },
  {
    id: '2',
    title: 'Perfect approach shot at Augusta',
    user: 'GolfPro_Sarah',
    timeAgo: '4 hours ago',
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=400&fit=crop',
    type: 'video',
    duration: '1:20'
  },
  {
    id: '3',
    title: 'Amazing eagle putt at St Andrews',
    user: 'LinksMaster',
    timeAgo: '6 hours ago',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop',
    type: 'video',
    duration: '0:32'
  }
];

const courseHighlights = [
  { id: '1', name: 'Augusta National', location: 'Georgia, USA', posts: 247, image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=300&h=200&fit=crop' },
  { id: '2', name: 'St. Andrews', location: 'Scotland', posts: 189, image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=300&h=200&fit=crop' },
  { id: '3', name: 'Pebble Beach', location: 'California, USA', posts: 156, image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop' },
  { id: '4', name: 'Royal County Down', location: 'Northern Ireland', posts: 134, image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=200&fit=crop' },
];

const topPlayers = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    bio: '2 HCP • Teaching Pro', 
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2f44?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop',
    type: 'image'
  },
  { 
    id: '2', 
    name: 'Marcus Rodriguez', 
    bio: '5 HCP • Course Designer', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop',
    type: 'video',
    duration: '2:15'
  },
  { 
    id: '3', 
    name: 'Emma Wilson', 
    bio: '3 HCP • Golf Instructor', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
    type: 'video',
    duration: '1:45'
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
  { 
    id: '2', 
    name: 'Riverside Country Club', 
    logo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=80&h=80&fit=crop',
    post: 'Championship tournament this weekend',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=300&h=200&fit=crop'
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

        {/* Featured Moments Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Moments</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {featuredMoments.map((moment) => (
                <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                    <img src={moment.image} alt={moment.title} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {moment.type === 'video' && (
                      <>
                        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {moment.duration}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="h-6 w-6 text-white fill-current" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-base font-semibold mb-1">{moment.title}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span>@{moment.user}</span>
                        <Clock className="h-3 w-3" />
                        <span>{moment.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Course Highlights Carousel - Two Grid Layout */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Course Highlights</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {courseHighlights.map((course) => (
                <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
                  <div className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                    <img src={course.image} alt={course.name} className="w-full h-32 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{course.name}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {course.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{course.posts} posts</Badge>
                        <Button size="sm" variant="outline">View More</Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Top Player Content Carousel - Three Grid Layout */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Top Player Content</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {topPlayers.map((player) => (
                <CarouselItem key={player.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                    <img src={player.contentImage} alt={player.name} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {player.type === 'video' && (
                      <>
                        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {player.duration}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="h-6 w-6 text-white fill-current" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm">{player.name}</h3>
                          <p className="text-white/80 text-xs">{player.bio}</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                        <UserPlus className="h-3 w-3 mr-2" />
                        Follow
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Trending Tips Carousel - Two Grid Layout */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Trending Tips</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {trendingTips.map((tip) => (
                <CarouselItem key={tip.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2">
                  <div className="bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
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
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">@{tip.user}</p>
                        <Button size="sm" variant="outline">View More</Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>

        {/* Club & Business Spotlight - Single Card Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Club & Business Spotlight</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {clubSpotlight.map((club) => (
                <CarouselItem key={club.id} className="pl-2 md:pl-4 basis-full">
                  <div className="bg-card rounded-lg overflow-hidden shadow-sm border">
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default ClubhouseFeed;
