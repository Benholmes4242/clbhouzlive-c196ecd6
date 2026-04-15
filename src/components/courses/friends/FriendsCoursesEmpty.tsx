import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FriendsCoursesEmpty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-[520px] w-full mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center gap-5">
        {/* Icon disc */}
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.07)' }}>
          <Users className="w-9 h-9" style={{ color: '#94A3B8' }} />
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          See where your friends play
        </h2>

        {/* Body */}
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '360px' }}>
          Follow golfers to unlock friends' course trails, ratings, and hidden gems.
        </p>

        {/* Primary CTA */}
        <Button
          onClick={() => navigate('/golferstofollow?source=friends_courses_empty')}
          className="w-full h-12 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: '#0F172A', borderRadius: '10px' }}
        >
          Find friends
        </Button>

        {/* Micro-tip */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', borderRadius: '10px', padding: '10px 16px' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            💡 <span style={{ fontWeight: 600 }}>Tip:</span> Following 5 golfers makes this tab come alive.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendsCoursesEmpty;
