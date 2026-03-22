import React, { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MapPin, Upload, Star, Globe,
  MoreHorizontal, ExternalLink, Copy, CheckCircle,
  XCircle, RefreshCw, Image,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useAdminV2Courses, type AdminCourseRow } from '../hooks/useAdminV2Courses';
import {
  AdminTable, AdminPageHeader, AdminSearchBar,
  AdminFilterBar, AdminKpiCard, AdminDrawer,
  AdminButton, AdminSectionHeader, AdminBulkActionBar,
} from '../components/ui';

// ─── Column helper ────────────────────────────────────────────────────────────

const col = createColumnHelper<AdminCourseRow>();

// ─── Rank badge pill ──────────────────────────────────────────────────────────

function RankPill({ label, rank, color }: { label: string; rank: number | null; color: string }) {
  if (!rank) return null;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label} #{rank}
    </span>
  );
}

// ─── Geocode status ───────────────────────────────────────────────────────────

function GeocodeStatus({ lat, lng }: { lat: number | null; lng: number | null }) {
  const hasCoords = lat != null && lng != null;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px]', hasCoords ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/60')}>
      {hasCoords
        ? <CheckCircle className="h-3.5 w-3.5" />
        : <XCircle className="h-3.5 w-3.5" />
      }
      {hasCoords ? 'Geocoded' : 'Missing'}
    </span>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────

function CourseRowMenu({
  course,
  onViewDetails,
}: {
  course: AdminCourseRow;
  onViewDetails: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors active:scale-90"
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-48 bg-popover border border-border rounded-xl shadow-lg py-1 animate-in fade-in-0 zoom-in-95">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60"
            >
              <MapPin className="h-3.5 w-3.5" />
              View details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View in app
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(course.id);
                toast.success('Course ID copied');
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy course ID
            </button>
            {course.website_url && (
              <a
                href={course.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Inline editable field ────────────────────────────────────────────────────

function InlineEditField({
  value,
  onSave,
  type = 'text',
  placeholder,
}: {
  value: string | number | null;
  onSave: (val: string) => void;
  type?: 'text' | 'number' | 'url';
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value ?? ''));

  const commit = () => {
    setEditing(false);
    if (draft !== String(value ?? '')) onSave(draft);
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
        className={cn(
          'text-[13px] text-left w-full rounded px-1 py-0.5 hover:bg-muted/60 transition-colors',
          value ? 'text-foreground' : 'text-muted-foreground/40 italic',
        )}
      >
        {value ?? placeholder ?? 'Click to edit'}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className="w-full text-[13px] px-2 py-1 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-border/40"
    />
  );
}

// ─── Course detail drawer ─────────────────────────────────────────────────────

function CourseDrawer({
  course,
  onClose,
  onUpdate,
  onUploadPhoto,
  isUploadingPhoto,
}: {
  course: AdminCourseRow | null;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
  onUploadPhoto: (courseId: string, file: File) => void;
  isUploadingPhoto: boolean;
}) {
  const navigate = useNavigate();

  return (
    <AdminDrawer
      open={!!course}
      onClose={onClose}
      title={course?.name ?? ''}
      subtitle={course ? `${course.country}${course.sub_country ? ` · ${course.sub_country}` : ''}` : undefined}
      footer={
        course ? (
          <div className="flex items-center gap-2">
            <AdminButton
              variant="primary"
              icon={ExternalLink}
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              View in App
            </AdminButton>
            {course.website_url && (
              <AdminButton
                variant="outline"
                icon={Globe}
                onClick={() => window.open(course.website_url!, '_blank')}
              >
                Website
              </AdminButton>
            )}
          </div>
        ) : undefined
      }
    >
      {!course ? null : (
        <div className="space-y-6">

          {/* Hero image with upload button */}
          <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted aspect-[16/9]">
            {course.thumbnail_image ? (
              <img src={course.thumbnail_image} alt={course.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && course) onUploadPhoto(course.id, file);
                }}
              />
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {isUploadingPhoto ? 'Uploading…' : 'Change photo'}
              </div>
            </label>
          </div>

          {/* Top 100 Lists */}
          <div className="space-y-3">
            <AdminSectionHeader title="Top 100 Lists" />
            {([
              { label: 'Global Top 100',   rankKey: 'global_rank' as const,   color: 'hsl(var(--accent-amber))' },
              { label: 'Regional Top 100', rankKey: 'regional_rank' as const, color: '#3b82f6' },
              { label: 'USA Top 100',      rankKey: 'usa_rank' as const,      color: '#dc2626' },
            ]).map(({ label, rankKey, color }) => (
              <div key={rankKey} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{label}</p>
                  {course[rankKey] && (
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      Currently ranked #{course[rankKey]}
                    </p>
                  )}
                </div>
                {course[rankKey] ? (
                  <div className="flex items-center gap-2">
                    <InlineEditField
                      value={course[rankKey]}
                      type="number"
                      placeholder="Rank"
                      onSave={(v) => onUpdate(course.id, { [rankKey]: v ? Number(v) : null })}
                    />
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate(course.id, { [rankKey]: null })}
                    >
                      Remove
                    </AdminButton>
                  </div>
                ) : (
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(course.id, { [rankKey]: 999 })}
                  >
                    Add to list
                  </AdminButton>
                )}
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <AdminSectionHeader title="Details" />
            {([
              { label: 'Name',     key: 'name',        value: course.name,        type: 'text' as const },
              { label: 'Website',  key: 'website_url', value: course.website_url, type: 'url' as const },
            ] as const).map(({ label, key, value, type }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-muted-foreground flex-shrink-0">{label}</span>
                <div className="flex-1 text-right">
                  <InlineEditField
                    value={value}
                    type={type}
                    onSave={(v) => onUpdate(course.id, { [key]: v || null })}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-start justify-between gap-4">
              <span className="text-[12.5px] text-muted-foreground flex-shrink-0 pt-1">Description</span>
              <div className="flex-1 text-right">
                <InlineEditField
                  value={course.description}
                  placeholder="Add description…"
                  onSave={(v) => onUpdate(course.id, { description: v || null })}
                />
              </div>
            </div>
          </div>


          {/* Location */}
          <div className="space-y-3">
            <AdminSectionHeader title="Location" />
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-muted-foreground">Country</span>
                <span className="text-[13px] text-foreground">{course.country}</span>
              </div>
              {course.sub_country && (
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-muted-foreground">Region</span>
                  <span className="text-[13px] text-foreground">{course.sub_country}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-muted-foreground">Coordinates</span>
                <span className="text-[12.5px] font-mono text-muted-foreground">
                  {course.latitude != null
                    ? `${course.latitude.toFixed(4)}, ${course.longitude?.toFixed(4)}`
                    : 'Not geocoded'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Community stats */}
          {(course.avg_rating != null || course.review_count != null) && (
            <div className="space-y-3">
              <AdminSectionHeader title="Community" />
              <div className="flex items-center gap-6">
                {course.avg_rating != null && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {course.avg_rating.toFixed(1)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Avg Rating</p>
                  </div>
                )}
                {course.review_count != null && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      {course.review_count.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Reviews</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Course ID</span>
              <button
                onClick={() => { navigator.clipboard.writeText(course.id); toast.success('Copied'); }}
                className="font-mono text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Copy className="h-3 w-3" />
                {course.id.slice(0, 8)}…
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Added</span>
              <span className="text-[12.5px] text-foreground">{format(new Date(course.created_at), 'd MMM yyyy')}</span>
            </div>
          </div>

        </div>
      )}
    </AdminDrawer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const navigate = useNavigate();
  const {
    courses, filteredCount, isLoading, refetch, stats, counts,
    search, setSearch, listFilter, setListFilter,
    page, setPage, pageSize, setPageSize,
    selectedIds, setSelectedIds,
    drawerCourseId, setDrawerCourseId, drawerCourse,
    updateCourse,
    uploadPhoto,
    isUploadingPhoto,
  } = useAdminV2Courses();

  const columns = React.useMemo(() => [
    col.display({
      id: 'thumbnail',
      header: '',
      size: 64,
      cell: ({ row }) => (
        <div className="h-10 w-14 rounded-lg overflow-hidden bg-muted border border-border/40 flex-shrink-0">
          {row.original.thumbnail_image ? (
            <img src={row.original.thumbnail_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-4 w-4 text-muted-foreground/30" />
            </div>
          )}
        </div>
      ),
    }),
    col.accessor('name', {
      header: 'Course',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-medium text-foreground truncate">
            {row.original.name}
          </span>
          <span className="text-[11.5px] text-muted-foreground truncate">
            {row.original.country}{row.original.sub_country ? ` · ${row.original.sub_country}` : ''}
          </span>
        </div>
      ),
    }),
    col.display({
      id: 'ranks',
      header: 'Rankings',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <RankPill label="G" rank={row.original.global_rank} color="hsl(var(--accent-amber))" />
          <RankPill label="R" rank={row.original.regional_rank} color="#3b82f6" />
          <RankPill label="US" rank={row.original.usa_rank} color="#dc2626" />
          {!row.original.global_rank && !row.original.regional_rank && !row.original.usa_rank && (
            <span className="text-[11px] text-muted-foreground/50">Unranked</span>
          )}
        </div>
      ),
    }),
    col.accessor('avg_rating', {
      header: 'Rating',
      enableSorting: true,
      cell: ({ getValue, row }) => {
        const rating = getValue();
        if (!rating) return <span className="text-[12px] text-muted-foreground/40">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[13px] font-medium text-foreground">
              {rating.toFixed(1)}
            </span>
            {row.original.review_count != null && (
              <span className="text-[11px] text-muted-foreground">
                ({row.original.review_count})
              </span>
            )}
          </div>
        );
      },
    }),
    col.display({
      id: 'geocoded',
      header: 'Geocode',
      cell: ({ row }) => (
        <GeocodeStatus lat={row.original.latitude} lng={row.original.longitude} />
      ),
    }),
    col.accessor('created_at', {
      header: 'Added',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {format(new Date(getValue()), 'd MMM yyyy')}
        </span>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <CourseRowMenu
          course={row.original}
          onViewDetails={() => setDrawerCourseId(row.original.id)}
        />
      ),
    }),
  ], [setDrawerCourseId]);

  const filterOptions = [
    { id: 'all',      label: 'All',             count: counts.all },
    { id: 'global',   label: 'Global Top 100',  count: counts.global,   variant: 'warning' as const },
    { id: 'usa',      label: 'USA Top 100',     count: counts.usa },
    { id: 'europe',   label: 'Europe Top 100',  count: counts.europe },
    { id: 'unranked', label: 'Unranked',         count: counts.unranked },
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <AdminPageHeader
        title="Golf Courses"
        description="Manage course records, rankings, and geocoding"
        action={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="ghost"
              icon={RefreshCw}
              onClick={() => refetch()}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              icon={Upload}
              onClick={() => navigate('/admin-v2/courses/import')}
            >
              Import Courses
            </AdminButton>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard title="Total Courses" value={stats.total} icon={MapPin} format="number" isLoading={isLoading} />
        <AdminKpiCard title="Geocoded" value={stats.geocoded} icon={Globe} format="number" isLoading={isLoading} />
        <AdminKpiCard title="With Images" value={stats.withImages} icon={Image} format="number" isLoading={isLoading} />
        <AdminKpiCard title="In Top 100" value={stats.inTop100} icon={Star} format="number" isLoading={isLoading} />
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search courses…" resultCount={filteredCount} />
        <AdminFilterBar filters={filterOptions} active={listFilter} onChange={setListFilter} />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={courses}
        isLoading={isLoading}
        getRowId={(c) => c.id}
        onRowClick={(c) => setDrawerCourseId(c.id)}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        enableRowSelection
        emptyTitle="No courses found"
        emptyDescription={search ? 'Try a different search' : 'No courses match the current filter'}
        emptyIcon={MapPin}
        pagination={{
          page,
          pageSize,
          total:          filteredCount,
          onPageChange:   setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      {/* Bulk action bar */}
      <AdminBulkActionBar
        selectedCount={selectedIds.size}
        noun="course"
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            id: 'export',
            label: 'Export CSV',
            onClick: () => {
              const rows = courses.filter(c => selectedIds.has(c.id));
              const csv  = [
                'ID,Name,Country,Global Rank,Regional Rank,USA Rank,Rating,Reviews,Geocoded,Added',
                ...rows.map(c => [
                  c.id, `"${c.name}"`, c.country,
                  c.global_rank ?? '', c.regional_rank ?? '', c.usa_rank ?? '',
                  c.avg_rating?.toFixed(1) ?? '', c.review_count ?? '',
                  (c.latitude != null).toString(), c.created_at,
                ].join(',')),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `courses-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            },
          },
        ]}
      />

      {/* Detail drawer */}
      <CourseDrawer
        course={drawerCourse}
        onClose={() => setDrawerCourseId(null)}
        onUpdate={updateCourse}
        onUploadPhoto={uploadPhoto}
        isUploadingPhoto={isUploadingPhoto}
      />

    </div>
  );
}
