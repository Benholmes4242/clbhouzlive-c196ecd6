import React from 'react';
import SecuritySettingsCard from '../SecuritySettingsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Users, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Security & Access</h3>
        <p className="text-sm text-muted-foreground">
          Authentication settings, session management, and access controls
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecuritySettingsCard />

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Management
            </CardTitle>
            <CardDescription>
              Monitor and manage active admin sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Current Session</span>
              </div>
              <Badge variant="outline" className="text-green-600">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Session timeout is configured in Security Settings. 
              Use the Auth Monitoring page for detailed session analytics.
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link to="/admin/auth-monitoring">
                <Users className="h-4 w-4 mr-2" />
                View Auth Monitoring
                <ExternalLink className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* API Keys Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              External service API keys and tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Supabase</span>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Cloudflare R2</span>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm">Cloudflare Stream</span>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              API keys are managed via Supabase Edge Function secrets.
              Access the Supabase dashboard to modify API configurations.
            </p>
          </CardContent>
        </Card>

        {/* Security Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit
            </CardTitle>
            <CardDescription>
              Review admin activity and security events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All admin actions are logged in the audit trail. 
              Review the Audit Log for detailed activity history.
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link to="/admin/audit">
                View Audit Log
                <ExternalLink className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SecurityTab;
