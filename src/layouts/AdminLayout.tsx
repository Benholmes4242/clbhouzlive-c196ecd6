import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useHideBottomNav } from "@/hooks/useBottomNavVisibility";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  
  // Hide bottom nav on all admin routes
  useHideBottomNav();

  return (
    <div className="flex h-screen w-full max-w-full overflow-x-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="w-[260px] shrink-0 border-r border-border hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 md:hidden">
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
          <span className="font-semibold text-foreground truncate">Admin Panel</span>
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
