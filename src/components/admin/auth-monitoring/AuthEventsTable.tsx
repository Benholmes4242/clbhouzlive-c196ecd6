import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, Filter, CheckCircle, XCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuthEvent } from '@/hooks/admin/useAuthMonitoringStats';

interface AuthEventsTableProps {
  events: AuthEvent[];
  loading?: boolean;
}

type EventFilter = 'all' | 'signup' | 'login' | 'auth' | 'failed';

const EVENT_TYPE_COLORS: Record<string, string> = {
  signup_success: 'bg-green-500/10 text-green-500 border-green-500/20',
  signup_failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  login_success: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  login_failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  auth_initiated: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  auth_complete: 'bg-green-500/10 text-green-500 border-green-500/20',
  auth_failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  auth_exception: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function getEventStatus(name: string): 'success' | 'failed' | 'pending' {
  if (name.includes('failed') || name.includes('exception')) return 'failed';
  if (name.includes('success') || name.includes('complete')) return 'success';
  return 'pending';
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown';
  
  // Simple UA parsing
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
}

export function AuthEventsTable({ events, loading }: AuthEventsTableProps) {
  const [filter, setFilter] = useState<EventFilter>('all');
  const [search, setSearch] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Apply type filter
      if (filter !== 'all') {
        if (filter === 'failed' && !event.name.includes('failed') && !event.name.includes('exception')) {
          return false;
        }
        if (filter !== 'failed' && !event.name.includes(filter)) {
          return false;
        }
      }
      
      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          event.name.toLowerCase().includes(searchLower) ||
          event.user_id?.toLowerCase().includes(searchLower) ||
          JSON.stringify(event.props).toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [events, filter, search]);

  const hasFilters = filter !== 'all' || search.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Recent Auth Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Recent Auth Events
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {filteredEvents.length} events
          </span>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filter} onValueChange={(v) => setFilter(v as EventFilter)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="signup">Signups</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="failed">Failed Only</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setFilter('all'); setSearch(''); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">Auth event tracking not enabled</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
              Login and signup events will appear here once auth event tracking is implemented in the authentication flow.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User/Method</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.slice(0, 50).map((event) => {
                  const status = getEventStatus(event.name);
                  const props = event.props as Record<string, unknown>;
                  
                  return (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={EVENT_TYPE_COLORS[event.name] || 'bg-muted'}
                        >
                          {event.name.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {status === 'failed' && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {status === 'pending' && (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {props.method && (
                          <span className="capitalize">{String(props.method)}</span>
                        )}
                        {event.user_id && (
                          <span className="text-xs text-muted-foreground block truncate max-w-[120px]">
                            {event.user_id.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {parseUserAgent(event.ua)}
                      </TableCell>
                      <TableCell className="text-right">
                        {props.error && (
                          <span className="text-xs text-red-500 truncate max-w-[150px] block">
                            {String(props.error).slice(0, 30)}...
                          </span>
                        )}
                        {props.duration_ms && (
                          <span className="text-xs text-muted-foreground">
                            {Number(props.duration_ms)}ms
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
