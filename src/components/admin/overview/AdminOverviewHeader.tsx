import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePanelRole } from "@/hooks/usePanelRole";

interface AdminOverviewHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminOverviewHeader({ 
  title = "Admin Overview", 
  subtitle = "Operations & system status" 
}: AdminOverviewHeaderProps) {
  const { role } = usePanelRole();

  const getRoleBadge = () => {
    if (role === "full") {
      return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">Full Admin</Badge>;
    }
    if (role === "limited") {
      return <Badge variant="secondary">Limited Admin</Badge>;
    }
    return null;
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-4 md:px-6 py-4 border-b border-border/50 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">{title}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
        </div>

        {/* Right: Search + Role */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search stub - mobile icon, desktop button */}
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 sm:hidden"
            disabled
            title="Search coming soon"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="hidden sm:flex items-center gap-2 h-9 px-3 text-muted-foreground"
            disabled
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-2 pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Role pill */}
          <div className="hidden sm:block">
            {getRoleBadge()}
          </div>
        </div>
      </div>
    </div>
  );
}
