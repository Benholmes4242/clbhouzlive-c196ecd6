import React, { useEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Tab = { id: string; label: string; content: React.ReactNode; };

export default function StickyTabs({ tabs, ctaBar }: { tabs: Tab[]; ctaBar?: React.ReactNode }) {
  const [value, setValue] = useState(tabs[0]?.id);
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <Tabs value={value} onValueChange={setValue} className="flex min-h-0 flex-1 flex-col">
      <div ref={ref} />
      <div className={cn("z-[1001] bg-background", stuck && "sticky top-0 border-b border-border")}>
        <div className="mx-4 md:mx-8">
          <TabsList className="grid grid-cols-4 gap-2">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="rounded-full">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-4 my-4 space-y-4 md:mx-8">
          {tabs.map(t => (
            <TabsContent key={t.id} value={t.id} className="m-0">
              {t.content}
            </TabsContent>
          ))}
        </div>
      </div>

      {ctaBar ? (
        <div className="sticky bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-md p-3">
          <div className="mx-auto max-w-[860px]">{ctaBar}</div>
        </div>
      ) : null}
    </Tabs>
  );
}