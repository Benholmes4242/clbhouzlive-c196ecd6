import AdminSettings from "@/components/admin/AdminSettings";
import UrlConversionTool from "@/components/admin/UrlConversionTool";

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSettings />
      <UrlConversionTool />
    </div>
  );
}
