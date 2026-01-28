import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image, GraduationCap, Flag, Trophy } from 'lucide-react';

interface AssetStats {
  logos: number;
  collegeLogos: number;
  countryFlags: number;
  tourLogos: number;
}

interface AssetManagerHeaderProps {
  stats: AssetStats;
  onUploadClick: () => void;
}

export const AssetManagerHeader: React.FC<AssetManagerHeaderProps> = ({
  stats,
  onUploadClick,
}) => {
  const totalAssets = stats.logos + stats.collegeLogos + stats.countryFlags + stats.tourLogos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Manager</h1>
          <p className="text-muted-foreground">Manage logos, flags, and brand assets</p>
        </div>
        <Button onClick={onUploadClick} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Image className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalAssets}</div>
              <div className="text-xs text-muted-foreground">Total Assets</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10">
              <Image className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.logos}</div>
              <div className="text-xs text-muted-foreground">Brand Logos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10">
              <GraduationCap className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.collegeLogos}</div>
              <div className="text-xs text-muted-foreground">College Logos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-500/10">
              <Flag className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.countryFlags}</div>
              <div className="text-xs text-muted-foreground">Country Flags</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-500/10">
              <Trophy className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.tourLogos}</div>
              <div className="text-xs text-muted-foreground">Tour Logos</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
