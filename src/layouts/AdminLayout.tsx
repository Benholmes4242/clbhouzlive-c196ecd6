import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useHideBottomNav } from "@/hooks/useBottomNavVisibility";
import { AdminNotificationsBell } from "@/components/admin/AdminNotificationsBell";
import { AdminCommandPalette, AdminSearchTrigger } from "@/components/admin/AdminCommandPalette";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Hide bottom nav on all admin routes
  useHideBottomNav();

  return (
    <div className="flex h-screen w-full max-w-full overflow-x-hidden bg-background">
      {/* Command palette */}
      <AdminCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      
      {/* Desktop sidebar */}
      <aside className="w-[260px] shrink-0 border-r border-border hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center gap-2 border-b border-border px-4">
          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <span className="font-semibold text-foreground truncate md:hidden">Admin Panel</span>
          
          {/* Desktop: Back to App link */}
          <Link
            to="/clubhouse"
            className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to App</span>
          </Link>
          
          {/* Desktop search */}
          <div className="hidden md:flex flex-1 justify-end">
            <AdminSearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          
          {/* Spacer for mobile */}
          <div className="flex-1 md:hidden" />
          
          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Notifications bell */}
          <AdminNotificationsBell />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 max-w-full pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
