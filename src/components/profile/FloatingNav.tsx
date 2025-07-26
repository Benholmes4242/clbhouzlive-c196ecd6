import React from 'react';
import { Button } from '@/components/ui/button';

interface FloatingNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ activeSection, onSectionChange }) => {
  const navItems = [
    { id: 'activity', label: 'Activity' },
    { id: 'handicap', label: 'Handicap' },
    { id: 'courses', label: 'Top 100' }
  ];

  return (
    <div className="sticky top-20 z-30 px-4 py-3">
      <div className="flex justify-center md:justify-end">
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full p-1 shadow-lg">
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSectionChange(item.id)}
                className={`rounded-full px-4 transition-all ${
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingNav;