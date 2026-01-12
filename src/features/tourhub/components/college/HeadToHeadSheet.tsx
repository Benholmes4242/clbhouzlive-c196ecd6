/**
 * HeadToHeadSheet - Bottom sheet comparing two colleges
 * Read-only initially, "Set as Rival" feature can be added later
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Users, DollarSign, Trophy, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CollegeBadge } from './CollegeBadge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CollegeCompareData {
  name: string;
  logoUrl?: string | null;
  playersCount: number;
  earnings: number;
  wins: number;
  cuts: number;
  top10s: number;
  weeklyEarningsDelta?: number;
}

interface HeadToHeadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  collegeA: CollegeCompareData | null;
  collegeB: CollegeCompareData | null;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const ComparisonRow: React.FC<{
  label: string;
  icon: React.ReactNode;
  valueA: number | string;
  valueB: number | string;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}> = ({ label, icon, valueA, valueB, format, higherIsBetter = true }) => {
  const numA = typeof valueA === 'number' ? valueA : 0;
  const numB = typeof valueB === 'number' ? valueB : 0;
  const aWins = higherIsBetter ? numA > numB : numA < numB;
  const bWins = higherIsBetter ? numB > numA : numB < numA;
  const tie = numA === numB;

  return (
    <div className="flex items-center py-3 border-b border-border/30 last:border-0">
      {/* Value A */}
      <div className={cn(
        "flex-1 text-right font-semibold tabular-nums",
        aWins && !tie ? "text-brand-orange" : "text-foreground"
      )}>
        {format ? format(numA) : valueA}
      </div>

      {/* Label */}
      <div className="flex-shrink-0 w-24 flex flex-col items-center gap-0.5 px-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>

      {/* Value B */}
      <div className={cn(
        "flex-1 text-left font-semibold tabular-nums",
        bWins && !tie ? "text-brand-orange" : "text-foreground"
      )}>
        {format ? format(numB) : valueB}
      </div>
    </div>
  );
};

export const HeadToHeadSheet: React.FC<HeadToHeadSheetProps> = ({
  isOpen,
  onClose,
  collegeA,
  collegeB,
}) => {
  if (!collegeA || !collegeB) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-sq-lg max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-lg font-semibold">
            Head to Head
          </SheetTitle>
        </SheetHeader>

        {/* College badges */}
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <CollegeBadge
              logoUrl={collegeA.logoUrl}
              name={collegeA.name}
              size="lg"
            />
            <span className="text-sm font-semibold text-foreground text-center max-w-[100px] truncate">
              {collegeA.name}
            </span>
          </div>

          <div className="text-2xl font-bold text-muted-foreground">VS</div>

          <div className="flex flex-col items-center gap-2">
            <CollegeBadge
              logoUrl={collegeB.logoUrl}
              name={collegeB.name}
              size="lg"
            />
            <span className="text-sm font-semibold text-foreground text-center max-w-[100px] truncate">
              {collegeB.name}
            </span>
          </div>
        </div>

        {/* Stats comparison */}
        <div className="mt-4 px-2">
          <ComparisonRow
            label="Players"
            icon={<Users className="w-4 h-4" />}
            valueA={collegeA.playersCount}
            valueB={collegeB.playersCount}
          />
          <ComparisonRow
            label="Earnings"
            icon={<DollarSign className="w-4 h-4" />}
            valueA={collegeA.earnings}
            valueB={collegeB.earnings}
            format={formatCurrency}
          />
          <ComparisonRow
            label="Wins"
            icon={<Trophy className="w-4 h-4" />}
            valueA={collegeA.wins}
            valueB={collegeB.wins}
          />
          <ComparisonRow
            label="Cuts"
            icon={<Target className="w-4 h-4" />}
            valueA={collegeA.cuts}
            valueB={collegeB.cuts}
          />
          <ComparisonRow
            label="Top 10s"
            icon={<TrendingUp className="w-4 h-4" />}
            valueA={collegeA.top10s}
            valueB={collegeB.top10s}
          />
        </div>

        {/* Future: Set as Rival button */}
        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-center text-xs text-muted-foreground">
            Rivalry tracking coming soon
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HeadToHeadSheet;
