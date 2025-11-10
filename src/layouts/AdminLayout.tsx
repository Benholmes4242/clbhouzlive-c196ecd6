import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="w-[260px] shrink-0 border-r border-border hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Mobile: sidebar can be a drawer in the AdminSidebar itself if needed */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
