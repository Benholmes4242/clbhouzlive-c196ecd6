import AuthMonitoringDashboard from "@/components/admin/AuthMonitoringDashboard";

export function AuthMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-2">Auth Monitoring</h2>
        <p className="text-muted-foreground">Monitor authentication health, user signups, and profile creation issues.</p>
      </div>
      <AuthMonitoringDashboard />
    </div>
  );
}

export default AuthMonitoringPage;
