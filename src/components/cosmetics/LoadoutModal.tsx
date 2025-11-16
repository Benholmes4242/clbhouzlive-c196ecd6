import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLoadout } from '@/hooks/useLoadout';
import { useUserCosmetics } from '@/hooks/useUserCosmetics';
import { Sparkles, CircleDot, Frame, MessageSquare, Palette } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LoadoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

const categoryIcons = {
  profile_ring: CircleDot,
  post_frame: Frame,
  reaction_pack: MessageSquare,
  title: Sparkles,
  theme: Palette,
};

const categoryLabels = {
  profile_ring: 'Profile Ring',
  post_frame: 'Post Frame',
  reaction_pack: 'Reaction Pack',
  title: 'Title',
  theme: 'Theme',
};

export function LoadoutModal({ open, onOpenChange, userId }: LoadoutModalProps) {
  const { loadout, setLoadout, isUpdating } = useLoadout(userId);
  const { unlocks } = useUserCosmetics(userId);
  const [selectedTab, setSelectedTab] = useState<string>('profile_ring');

  const getUnlockedItemsByCategory = (category: string) => {
    return unlocks.filter(unlock => unlock.item?.category === category);
  };

  const getCurrentEquipped = (category: string) => {
    if (!loadout) return null;
    
    const key = `equipped_${category}` as keyof typeof loadout;
    return loadout[key] as string | null;
  };

  const handleEquip = (category: string, itemId: string | null) => {
    const key = `equipped_${category}`;
    setLoadout({ [key]: itemId });
  };

  const categories = ['profile_ring', 'post_frame', 'reaction_pack', 'title', 'theme'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Customize Your Look
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(category => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <TabsTrigger key={category} value={category} className="flex flex-col gap-1 h-auto py-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map(category => {
            const items = getUnlockedItemsByCategory(category);
            const equipped = getCurrentEquipped(category);

            return (
              <TabsContent key={category} value={category} className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {/* None option */}
                    <div
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${equipped === null ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      `}
                      onClick={() => handleEquip(category, null)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">None</p>
                          <p className="text-sm text-muted-foreground">No cosmetic equipped</p>
                        </div>
                        {equipped === null && (
                          <Badge>Equipped</Badge>
                        )}
                      </div>
                    </div>

                    {/* Unlocked items */}
                    {items.length > 0 ? (
                      items.map(unlock => {
                        if (!unlock.item) return null;
                        
                        const isEquipped = equipped === unlock.item.id;

                        return (
                          <div
                            key={unlock.id}
                            className={`
                              p-4 border rounded-lg cursor-pointer transition-all
                              ${isEquipped ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                            `}
                            onClick={() => handleEquip(category, unlock.item!.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold">{unlock.item.name}</p>
                                  {unlock.item.is_premium_only && (
                                    <Sparkles className="w-3 h-3 text-yellow-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {unlock.item.description}
                                </p>
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {unlock.item.rarity}
                                </Badge>
                              </div>
                              {isEquipped && (
                                <Badge>Equipped</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-2">No items unlocked yet</p>
                        <p className="text-sm">Visit the Season Shop to unlock cosmetics!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
