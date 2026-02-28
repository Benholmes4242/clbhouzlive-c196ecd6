import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

export function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    acceptInvite();
  }, []);

  const acceptInvite = async () => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link. No token provided.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const returnUrl = encodeURIComponent(`/admin/invite-accept?token=${token}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-manage", {
        body: { action: "accept_invite", token },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStatus("success");
      setRole(data.role);
      setMessage(`Admin access granted! You now have ${data.role} admin privileges.`);
      
      toast.success("Success", {
        description: "Admin invitation accepted successfully",
      });

      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to accept invitation. It may be invalid or expired.");
      toast.error("Error", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing invitation...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">{message}</p>
                {role && (
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="font-semibold capitalize">{role}</span> Admin
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Redirecting to admin panel...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button onClick={() => navigate("/")}>Return Home</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
