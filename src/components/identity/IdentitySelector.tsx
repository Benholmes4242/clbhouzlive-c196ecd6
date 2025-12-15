import { ChevronDown, Check, Building2, User } from 'lucide-react';
import { useActiveActor, ActiveActor } from '@/context/ActiveActorContext';
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

  const renderAvatar = (actor: ActiveActor, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

    if (actor.avatarUrl) {
      return (
        <img
          src={actor.avatarUrl}
          alt={actor.name}
          className={`${sizeClass} rounded-full object-cover`}
        />
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-muted flex items-center justify-center ${textSize} font-medium`}>
        {getInitials(actor.name)}
      </div>
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
  const triggerStyles = variant === 'dark' 
    ? {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }
    : undefined;

  const triggerClasses = variant === 'dark'
    ? `inline-flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sq-pill transition-colors hover:bg-white/12`
    : `inline-flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sq-pill border border-border/60 bg-background/60 hover:bg-background/80 transition-colors`;

  const textClasses = variant === 'dark'
    ? `${compact ? 'text-xs' : 'text-sm'} font-medium truncate max-w-[120px] text-white`
    : `${compact ? 'text-xs' : 'text-sm'} font-medium truncate max-w-[120px]`;

  const chevronClasses = variant === 'dark'
    ? 'h-3 w-3 text-white/50'
    : 'h-3 w-3 text-muted-foreground';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClasses} style={triggerStyles}>
          {renderAvatar(activeActor)}
          <span className={textClasses}>
            {activeActor.name}
          </span>
          <ChevronDown className={chevronClasses} />
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
