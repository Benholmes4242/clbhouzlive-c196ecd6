
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Users, Globe } from 'lucide-react';

const FriendsCourses = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-[#b66b41]/10 to-green-50 border-[#b66b41]/20">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <Compass className="h-16 w-16 text-[#b66b41] mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Top 100 Explorer!
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've redesigned this page into a comprehensive discovery experience. 
              Explore Top 100 courses played by your friends and the entire Clbhouz community, 
              see user-generated content, and discover your next golfing destination.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg border">
                <Users className="h-8 w-8 text-[#b66b41] mb-2" />
                <h3 className="font-semibold mb-1">Friends Activity</h3>
                <p className="text-sm text-gray-600">See what Top 100 courses your friends have played</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <Globe className="h-8 w-8 text-[#b66b41] mb-2" />
                <h3 className="font-semibold mb-1">Community Feed</h3>
                <p className="text-sm text-gray-600">Discover courses through user photos and videos</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <Compass className="h-8 w-8 text-[#b66b41] mb-2" />
                <h3 className="font-semibold mb-1">Interactive Filters</h3>
                <p className="text-sm text-gray-600">Filter by region, search courses, and explore maps</p>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/top100-explorer')}
              className="bg-[#b66b41] hover:bg-[#9a5a37] text-white px-8 py-3 text-lg"
            >
              Launch Top 100 Explorer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsCourses;
