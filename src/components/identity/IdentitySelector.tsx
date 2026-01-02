import { ChevronDown, Check, Building2, User } from 'lucide-react';
import { useActiveActor, ActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface IdentitySelectorProps {
  /** Compact mode for mobile/modal use */
  compact?: boolean;
  /** Visual variant - 'light' for light backgrounds, 'dark' for dark/glass backgrounds */
  variant?: 'light' | 'dark';
}

export function IdentitySelector({ compact = false, variant = 'light' }: IdentitySelectorProps) {
  const { activeActor, setActiveActor, availableActors, isLoading } = useActiveActor();

  // Don't show if only personal identity available
  if (availableActors.length <= 1 || isLoading || !activeActor) {
    return null;
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  // Truncate display name to prevent layout breaks
  const truncateDisplayName = (name: string, maxLength = 18) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };

  const renderAvatar = (actor: ActiveActor, size: 'sm' | 'md' = 'sm') => {
    // Use SDS squircle avatar - matches Clubhouse header PostingAsPill
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
    return actor.type === 'business' ? (
      <Building2 className="h-3 w-3 text-muted-foreground" />
    ) : (
      <User className="h-3 w-3 text-muted-foreground" />
    );
  };

  // Style variants
  // 'dark' matches the Clubhouse header PostingAsPill styling
  const triggerStyles = undefined;

  const triggerClasses = variant === 'dark'
    ? `inline-flex items-center gap-2 ${compact ? 'pl-1.5 pr-2.5 py-1' : 'pl-2 pr-3 py-1.5'} rounded-sq-pill bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 transition-colors`
    : `inline-flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sq-pill border hover:opacity-90 transition-colors`;

  const lightTriggerStyle = variant === 'light' ? {
    background: 'var(--cm-surface-alt)',
    borderColor: 'var(--cm-border)',
  } : undefined;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClasses} style={lightTriggerStyle}>
          {renderAvatar(activeActor)}
          <span className={textClasses} style={lightTextStyle}>
            {truncateDisplayName(activeActor.name, 18)}
          </span>
          <ChevronDown className={chevronClasses} style={lightChevronStyle} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Posting as
        </div>
        <DropdownMenuSeparator />
        
        {availableActors.map((actor) => {
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
                  {getActorIcon(actor)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {actor.type === 'personal' ? 'Personal profile' : 'Business'}
                </span>
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
