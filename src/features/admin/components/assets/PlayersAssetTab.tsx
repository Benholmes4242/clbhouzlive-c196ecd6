import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, RefreshCw, Upload, Trash2, CheckCircle, XCircle, LayoutGrid, List, User,
} from 'lucide-react';
import { usePlayerHeadshotManager, TOUR_OPTIONS, type PlayerEntry } from '../../hooks/usePlayerHeadshotManager';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const TOUR_COLORS: Record<string, string> = {
  pga: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  euro: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  lpga: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
  pgad: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  liv: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA', euro: 'DPWT', lpga: 'LPGA', pgad: 'KFT', liv: 'LIV',
};

export default function PlayersAssetTab() {
  const {
    players, isLoading, checkingPhotos, stats,
    searchQuery, setSearchQuery,
    filterByTour, setFilterByTour,
    filterByStatus, setFilterByStatus,
    uploadHeadshot, deleteHeadshot, refreshStatuses,
  } = usePlayerHeadshotManager();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload preview dialog
  const [uploadTarget, setUploadTarget] = useState<PlayerEntry | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerPlayerRef = useRef<PlayerEntry | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PlayerEntry | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && triggerPlayerRef.current) {
      setSelectedFile(file);
      setUploadTarget(triggerPlayerRef.current);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openFilePicker = (player: PlayerEntry) => {
    triggerPlayerRef.current = player;
    fileInputRef.current?.click();
  };

  const confirmUpload = async () => {
    if (!uploadTarget || !selectedFile) return;
    setUploading(uploadTarget.id);
    try {
      await uploadHeadshot(selectedFile, uploadTarget);
      toast.success(`Headshot uploaded for ${uploadTarget.full_name}`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(null);
      setUploadTarget(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await deleteHeadshot(deleteTarget);
      toast.success(`Headshot removed for ${deleteTarget.full_name}`);
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  // Stats bar pill component
  const StatPill = ({ label, count, status }: { label: string; count: number; status: 'all' | 'with_photo' | 'missing' }) => (
    <button
      onClick={() => setFilterByStatus(filterByStatus === status ? 'all' : status)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        filterByStatus === status
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}: {count}
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="Total" count={stats.total} status="all" />
        <StatPill label="✅ With Photo" count={stats.withPhoto} status="with_photo" />
        <StatPill label="❌ Missing" count={stats.missing} status="missing" />
        {stats.pending > 0 && (
          <span className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground bg-muted">
            ⏳ Checking: {stats.pending}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterByTour} onValueChange={setFilterByTour}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOUR_OPTIONS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost" size="icon"
          onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
        >
          {viewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={refreshStatuses} disabled={checkingPhotos}>
          <RefreshCw className={`h-4 w-4 ${checkingPhotos ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{players.length} players shown</p>

      {/* List view */}
      {viewMode === 'list' ? (
        <div className="divide-y divide-border rounded-lg border overflow-hidden">
          {players.slice(0, 200).map(player => (
            <div key={player.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
              {/* Thumbnail */}
              <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0">
                <img
                  src={player.headshotUrl}
                  alt={player.full_name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{player.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${TOUR_COLORS[player.primaryTourCode] || ''}`}>
                    {TOUR_LABELS[player.primaryTourCode] || player.primaryTourCode.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="shrink-0">
                {player.hasPhoto === null ? (
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                ) : player.hasPhoto ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => openFilePicker(player)}
                  disabled={uploading === player.id}
                >
                  {uploading === player.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {player.hasPhoto ? 'Replace' : 'Upload'}
                    </>
                  )}
                </Button>
                {player.hasPhoto && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(player)}
                    disabled={deleting === player.id}
                  >
                    {deleting === player.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {players.length > 200 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Showing first 200 of {players.length}. Use search to narrow down.
            </div>
          )}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-3 gap-3">
          {players.slice(0, 150).map(player => (
            <div key={player.id} className="rounded-lg border bg-card overflow-hidden">
              <div className="aspect-[3/4] bg-muted overflow-hidden">
                <img
                  src={player.headshotUrl}
                  alt={player.full_name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate">{player.full_name}</p>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${TOUR_COLORS[player.primaryTourCode] || ''}`}>
                  {TOUR_LABELS[player.primaryTourCode] || player.primaryTourCode.toUpperCase()}
                </Badge>
                <Button
                  variant="ghost" size="sm" className="w-full text-xs h-7 mt-1"
                  onClick={() => openFilePicker(player)}
                  disabled={uploading === player.id}
                >
                  {uploading === player.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      {player.hasPhoto ? 'Replace' : 'Upload'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Preview Dialog */}
      <Dialog open={!!uploadTarget} onOpenChange={(open) => { if (!open) { setUploadTarget(null); setPreviewUrl(null); setSelectedFile(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Headshot</DialogTitle>
            <DialogDescription>Upload for {uploadTarget?.full_name}</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="flex justify-center">
              <div className="w-40 h-52 rounded-lg overflow-hidden bg-muted border">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover object-top" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadTarget(null); setPreviewUrl(null); setSelectedFile(null); }}>
              Cancel
            </Button>
            <Button onClick={confirmUpload} disabled={uploading !== null}>
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload for {uploadTarget?.full_name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove headshot?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove headshot for {deleteTarget?.full_name}? The silhouette placeholder will be shown instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
