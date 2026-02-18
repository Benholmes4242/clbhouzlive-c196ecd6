import { ChevronDown, Check, Building2, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveActor, ActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { postingAsCopy } from '@/lib/postingAsCopy';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface IdentitySelectorProps {
  /** Compact mode for mobile/modal use */
  compact?: boolean;
  /** Visual variant - 'light' for light backgrounds, 'dark' for dark/glass backgrounds */
  variant?: 'light' | 'dark';
  /** When true, selector becomes transparent (used when header is dimmed) */
  isDimmed?: boolean;
}

export function IdentitySelector({ compact = false, variant = 'light', isDimmed = false }: IdentitySelectorProps) {
  const navigate = useNavigate();
  const { activeActor, setActiveActor, availableActors, isLoading } = useActiveActor();

  // Don't show if loading or no activeActor
  if (isLoading || !activeActor) {
    return null;
  }

  // Group actors by type (no more creator type)
  const personalActors = availableActors.filter(a => a.type === 'personal');
  const businessActors = availableActors.filter(a => a.type === 'business');

  // Show selector if user has more than personal profile OR always show for navigation
  const hasMultipleActors = availableActors.length > 1;

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  // Truncate display name to prevent layout breaks
  const truncateDisplayName = (name: string, maxLength = 18) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };

  const renderAvatar = (actor: ActiveActor, size: 'sm' | 'md' = 'sm') => {
    const sizePixels = size === 'sm' ? 24 : 32;
    return (
      <SquircleAvatar
        size={sizePixels}
        src={actor.avatarUrl}
        alt={actor.name}
        fallback={getInitials(actor.name)}
        hideRing
      />
    );
  };

  const getActorIcon = (actor: ActiveActor) => {
    switch (actor.type) {
      case 'business':
        return <Building2 className="h-3 w-3 text-muted-foreground" />;
      default:
        return <User className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Style variants - supports dimmed state
  const triggerClasses = isDimmed
    ? `inline-flex items-center gap-2 ${compact ? 'pl-1.5 pr-2.5 py-1' : 'pl-2 pr-3 py-1.5'} rounded-sq-pill transition-all duration-500`
    : variant === 'dark'
      ? `inline-flex items-center gap-2 ${compact ? 'pl-1.5 pr-2.5 py-1' : 'pl-2 pr-3 py-1.5'} rounded-sq-pill bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 transition-colors`
      : `inline-flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sq-pill border hover:opacity-90 transition-colors`;

  const getTriggerStyle = () => {
    if (isDimmed) {
      return {
        background: 'transparent',
        border: '1px solid transparent',
        backdropFilter: 'none',
      };
    }
    if (variant === 'light') {
      return {
        background: 'var(--cm-surface-alt)',
        borderColor: 'var(--cm-border)',
      };
    }
    return undefined;
  };

  const textClasses = variant === 'dark'
    ? `${compact ? 'text-xs' : 'text-sm'} font-medium truncate max-w-[140px] text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis`
    : `${compact ? 'text-xs' : 'text-sm'} font-medium truncate max-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis`;

  const lightTextStyle = variant === 'light' ? {
    color: 'var(--cm-text-primary)',
  } : undefined;

  const chevronClasses = variant === 'dark'
    ? 'h-3 w-3 text-white/50'
    : 'h-3 w-3';

  const lightChevronStyle = variant === 'light' ? {
    color: 'var(--cm-text-secondary)',
  } : undefined;

  const renderActorRow = (actor: ActiveActor) => {
    const isActive = activeActor.type === actor.type && activeActor.id === actor.id;
    
    return (
      <DropdownMenuItem
        key={`${actor.type}-${actor.id}`}
        onClick={() => setActiveActor(actor)}
        className="flex items-center gap-3 py-2"
      >
        {renderAvatar(actor, 'md')}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">{actor.name}</span>
            {actor.verified && <VerifiedBadge size="sm" />}
            {getActorIcon(actor)}
          </div>
          <span className="text-xs text-muted-foreground">
            {actor.type === 'personal' && postingAsCopy.actorLabels.personal}
            {actor.type === 'business' && postingAsCopy.actorLabels.business}
          </span>
        </div>
        {isActive && (
          <Check className="h-4 w-4 text-primary flex-shrink-0" />
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClasses} style={getTriggerStyle()}>
          {renderAvatar(activeActor)}
          <span className={textClasses} style={lightTextStyle}>
            {truncateDisplayName(activeActor.name, 18)}
          </span>
          <ChevronDown className={chevronClasses} style={lightChevronStyle} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Posting as
        </div>
        <DropdownMenuSeparator />
        
        {/* Personal Section */}
        {personalActors.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              {postingAsCopy.sectionLabels.personal}
            </DropdownMenuLabel>
            {personalActors.map(renderActorRow)}
          </>
        )}

        {/* Business Section */}
        {(businessActors.length > 0 || hasMultipleActors) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              {postingAsCopy.sectionLabels.businesses}
            </DropdownMenuLabel>
            {businessActors.length > 0 ? (
              businessActors.map(renderActorRow)
            ) : (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                {postingAsCopy.emptyState.body}
              </div>
            )}
            <DropdownMenuItem
              onClick={() => navigate('/businesses/manage')}
              className="flex items-center gap-2 py-2 text-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="text-xs">{postingAsCopy.managementLinks.businesses}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
