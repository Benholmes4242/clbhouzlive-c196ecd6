import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ManualVideoMigration() {
  const [r2Url, setR2Url] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateReferences = async () => {
    if (!r2Url || !streamUrl) {
      toast.error("Please provide both R2 URL and Stream URL");
      return;
    }

    setIsUpdating(true);
    try {
      // You can create a simple edge function to update database references
      const response = await fetch('/api/update-video-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldUrl: r2Url, newUrl: streamUrl })
      });

      if (response.ok) {
        toast.success("References updated");
        setR2Url("");
        setStreamUrl("");
      } else {
        throw new Error("Failed to update references");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Couldn't update references");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Manual Video Migration
        </CardTitle>
        <CardDescription>
          Manually update video references from R2 to Cloudflare Stream
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Manual Process:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to your <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline font-medium">Cloudflare Dashboard</a></li>
              <li>Navigate to Stream in the sidebar</li>
              <li>Upload your videos from R2 to Stream</li>
              <li>Copy the Stream URL and paste below to update database references</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="r2-url">Original R2 URL</Label>
            <Input
              id="r2-url"
              placeholder="https://media.clbhouz.co.uk/path/to/video.mp4"
              value={r2Url}
              onChange={(e) => setR2Url(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="stream-url">New Cloudflare Stream URL</Label>
            <Input
              id="stream-url"
              placeholder="https://customer-4ah4gni80ytefpck.cloudflarestream.com/video-id/manifest/video.m3u8"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleUpdateReferences}
            disabled={isUpdating || !r2Url || !streamUrl}
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Update Database References"}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Quick Links:</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Cloudflare Dashboard
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.cloudflare.com/stream/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Stream Docs
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}