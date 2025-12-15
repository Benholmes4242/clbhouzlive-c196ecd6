import AdminSettings from "@/components/admin/AdminSettings";
import UrlConversionTool from "@/components/admin/UrlConversionTool";
import { VerificationCleanSlateTool } from "@/components/admin/VerificationCleanSlateTool";

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSettings />
      <UrlConversionTool />
      <VerificationCleanSlateTool />
    </div>
  );
}
