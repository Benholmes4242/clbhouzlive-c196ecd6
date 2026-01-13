import React, { useState } from 'react';
import { Plus, Calendar, Users, Plane, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyEventsList } from './MyEventsList';
import { CreateEventWizard } from './create-event/CreateEventWizard';
import { cn } from '@/lib/utils';

export function EventsHubSection() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardType, setWizardType] = useState<'society_day' | 'multi_day' | 'tournament' | undefined>();

  const handleQuickCreate = (type: 'society_day' | 'multi_day' | 'tournament') => {
    setWizardType(type);
    setWizardOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick Create Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Create Event</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleQuickCreate('society_day')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Society Day</span>
          </button>
          
          <button
            onClick={() => handleQuickCreate('multi_day')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Golf Trip</span>
          </button>
          
          <button
            onClick={() => handleQuickCreate('tournament')}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Tournament</span>
          </button>
        </div>
      </div>

      {/* My Events */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">My Events</h3>
        <MyEventsList 
          onCreateEvent={() => setWizardOpen(true)} 
          limit={3} 
          showViewAll={true}
        />
      </div>

      {/* Wizard */}
      {wizardOpen && (
        <CreateEventWizard 
          onClose={() => { setWizardOpen(false); setWizardType(undefined); }} 
          initialType={wizardType}
        />
      )}
    </div>
  );
}
