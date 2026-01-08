import React, { useState, useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useSeasonShop } from '@/hooks/useSeasonShop';
import { useUserCosmetics } from '@/hooks/useUserCosmetics';
import { useSeasonPass } from '@/hooks/useSeasonPass';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Sparkles, Coins } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';

const rarityColors = {
  legendary: 'from-yellow-500 to-orange-500',
  epic: 'from-purple-500 to-pink-500',
  rare: 'from-blue-500 to-cyan-500',
  common: 'from-gray-400 to-gray-500',
};

const rarityGlows = {
  legendary: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]',
  epic: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
  rare: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
  common: 'shadow-[0_0_15px_rgba(156,163,175,0.3)]',
};

export default function SeasonShop() {
  const { setVariant } = useHeader();
  const [userId, setUserId] = useState<string | undefined>();
  const { data: currentSeason } = useCurrentSeason();
  const { data: shopItems, isLoading: isLoadingShop } = useSeasonShop(currentSeason?.id);
  const { unlocks, currency, unlockItem, isUnlocking } = useUserCosmetics(userId);
  const { hasPremiumPass } = useSeasonPass(userId, currentSeason?.id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  const isUnlocked = (itemId: string) => {
    return unlocks.some(unlock => unlock.item_id === itemId);
  };

  const canUnlock = (item: any) => {
    return !isUnlocked(item.id) && 
           currency >= item.cost && 
           (!item.is_premium_only || hasPremiumPass);
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'profile_ring', label: 'Profile Rings' },
    { id: 'post_frame', label: 'Post Frames' },
    { id: 'reaction_pack', label: 'Reactions' },
    { id: 'title', label: 'Titles' },
    { id: 'theme', label: 'Themes' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems?.filter(item => item.category === selectedCategory);

  return (
    <PageRoot className="min-h-screen bg-background pb-24">
      <div>
        {/* Header */}
        <div className="px-4 py-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Season Shop</h1>
            <p className="text-muted-foreground mb-4">
              Unlock exclusive cosmetics for {currentSeason?.name || 'the current season'}
            </p>
            
            <div className="flex items-center gap-2 bg-card p-3 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{currency}</span>
              <span className="text-sm text-muted-foreground">Season Coins</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pt-6 max-w-4xl mx-auto">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full flex overflow-x-auto">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="flex-1 whitespace-nowrap">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Items Grid */}
        <div className="px-4 py-6 max-w-4xl mx-auto">
          {isLoadingShop ? (
            <div className="text-center py-12 text-muted-foreground">Loading shop...</div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const unlocked = isUnlocked(item.id);
                const canBuy = canUnlock(item);
                const isPremiumLocked = item.is_premium_only && !hasPremiumPass;

                return (
                  <Card 
                    key={item.id}
                    className={`
                      relative overflow-hidden transition-all duration-300
                      ${rarityGlows[item.rarity]}
                      ${unlocked ? 'opacity-75' : ''}
                    `}
                  >
                    {/* Rarity gradient border */}
                    <div className={`
                      absolute inset-0 opacity-50
                      bg-gradient-to-br ${rarityColors[item.rarity]}
                      -z-10
                    `} />
                    
                    <div className="p-4 bg-card/95 backdrop-blur-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`
                              text-xs
                              bg-gradient-to-r ${rarityColors[item.rarity]}
                              border-none text-white
                            `}
                          >
                            {item.rarity}
                          </Badge>
                        </div>
                        
                        {item.is_premium_only && (
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{item.cost}</span>
                        </div>

                        {unlocked ? (
                          <Button size="sm" variant="outline" disabled>
                            Owned
                          </Button>
                        ) : isPremiumLocked ? (
                          <Button size="sm" variant="outline" disabled>
                            <Lock className="w-4 h-4 mr-1" />
                            Premium
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canBuy || isUnlocking}
                            onClick={() => unlockItem({ itemId: item.id, cost: item.cost })}
                          >
                            Unlock
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No items available in this category
            </div>
          )}
        </div>
      </div>
    </PageRoot>
  );
}