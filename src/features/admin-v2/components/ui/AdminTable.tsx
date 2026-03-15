import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  selectedIds?: Set<string>;
  onSelectChange?: (ids: Set<string>) => void;
  enableRowSelection?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  className?: string;
  stickyHeader?: boolean;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded" style={{ width: `${60 + Math.random() * 40}%`, background: '#F1F5F9' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function TableEmpty({
  title,
  description,
  icon: Icon,
  cols,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  cols: number;
}) {
  return (
    <tr>
      <td colSpan={cols} className="py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          {Icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: '#F1F5F9' }}>
              <Icon className="w-5 h-5" style={{ color: '#94A3B8' }} />
            </div>
          )}
          <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{title}</p>
          {description && (
            <p className="text-xs max-w-xs" style={{ color: '#64748B' }}>{description}</p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: NonNullable<AdminTableProps<any>['pagination']>) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #E2E8F0' }}>
      <div className="flex items-center gap-3">
        <span className="text-[12px] tabular-nums" style={{ color: '#64748B' }}>
          {total === 0 ? 'No results' : `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-[12px] rounded-md px-2 py-1 outline-none"
            style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#334155' }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 flex items-center justify-center rounded-[10px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          style={{ border: '1px solid #E2E8F0' }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: '#334155' }} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((item, i) =>
            item === '...'
              ? <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-[12px]" style={{ color: '#94A3B8' }}>…</span>
              : (
                <button
                  key={item}
                  onClick={() => onPageChange(item as number)}
                  className="h-8 w-8 flex items-center justify-center rounded-[10px] text-[12px] font-medium transition-colors active:scale-95"
                  style={page === item
                    ? { background: '#F5A623', color: '#FFFFFF' }
                    : { color: '#64748B' }
                  }
                >
                  {item}
                </button>
              )
          )
        }

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-[10px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          style={{ border: '1px solid #E2E8F0' }}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" style={{ color: '#334155' }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No results',
  emptyDescription,
  emptyIcon,
  onRowClick,
  getRowId,
  selectedIds,
  onSelectChange,
  enableRowSelection,
  pagination,
  className,
  stickyHeader = true,
}: AdminTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setLastSelectedIndex(null);
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    manualPagination: true,
  });

  const colCount = columns.length + (enableRowSelection ? 1 : 0);

  return (
    <div
      className={cn('overflow-hidden', className)}
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 13.5 }}>
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className={cn(stickyHeader && 'sticky top-0 z-10')} style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                {enableRowSelection && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      style={{ accentColor: '#F5A623' }}
                      checked={selectedIds ? selectedIds.size === data.length && data.length > 0 : false}
                      onChange={(e) => {
                        if (!getRowId || !onSelectChange) return;
                        onSelectChange(
                          e.target.checked
                            ? new Set(data.map(getRowId))
                            : new Set()
                        );
                      }}
                    />
                  </th>
                )}
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={cn(
                      'px-4 py-3 text-left',
                      header.column.getCanSort() && 'cursor-pointer select-none',
                    )}
                    style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc'
                          ? <ChevronUp className="w-3 h-3" style={{ color: '#F5A623' }} />
                          : header.column.getIsSorted() === 'desc'
                            ? <ChevronDown className="w-3 h-3" style={{ color: '#F5A623' }} />
                            : <ChevronsUpDown className="w-3 h-3" style={{ color: '#CBD5E1' }} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              <TableSkeleton cols={colCount} />
            ) : data.length === 0 ? (
              <TableEmpty title={emptyTitle} description={emptyDescription} icon={emptyIcon} cols={colCount} />
            ) : (
              table.getRowModel().rows.map((row, index) => {
                const isSelected = selectedIds?.has(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#FFF7ED' : undefined,
                    }}
                    className={cn(
                      'transition-colors duration-75',
                      onRowClick && 'cursor-pointer',
                    )}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {enableRowSelection && (
                      <td className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          style={{ accentColor: '#F5A623' }}
                          checked={isSelected ?? false}
                          onChange={(e) => {
                            if (!onSelectChange) return;
                            const next = new Set(selectedIds);
                            if (e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey && lastSelectedIndex !== null) {
                              const startIdx = Math.min(lastSelectedIndex, index);
                              const endIdx   = Math.max(lastSelectedIndex, index);
                              table.getRowModel().rows.slice(startIdx, endIdx + 1).forEach(r => {
                                e.target.checked ? next.add(r.id) : next.delete(r.id);
                              });
                            } else {
                              e.target.checked ? next.add(row.id) : next.delete(row.id);
                            }
                            setLastSelectedIndex(index);
                            onSelectChange(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3" style={{ color: '#334155' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}
