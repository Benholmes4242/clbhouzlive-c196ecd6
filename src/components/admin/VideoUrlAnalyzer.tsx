import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  success: boolean;
  analysis: {
    post_media: { r2_videos: number; stream_videos: number; total: number };
    profile_media: { r2_videos: number; stream_videos: number; total: number };
    course_review_media: { r2_videos: number; stream_videos: number; total: number };
  };
  summary: {
    total_r2_videos: number;
    total_stream_videos: number;
    total_videos: number;
  };
  error?: string;
}

export function VideoUrlAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video-urls');
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      if (data.success) {
        toast.success("Analysis complete");
      } else {
        toast.error("Couldn't analyze URLs");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Couldn't analyze URLs");
      setResult({ 
        error: error.message, 
        success: false,
        analysis: {
          post_media: { r2_videos: 0, stream_videos: 0, total: 0 },
          profile_media: { r2_videos: 0, stream_videos: 0, total: 0 },
          course_review_media: { r2_videos: 0, stream_videos: 0, total: 0 }
        },
        summary: { total_r2_videos: 0, total_stream_videos: 0, total_videos: 0 }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Video URL Analyzer
        </CardTitle>
        <CardDescription>
          Analyze video URLs to identify which are using R2 vs Stream storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {result && result.summary.total_r2_videos > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issue Found:</strong> {result.summary.total_r2_videos} videos are still using R2 URLs instead of Stream URLs. These will fail to load.
            </AlertDescription>
          </Alert>
        )}

        {result && result.success && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Stream Videos</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{result.summary.total_stream_videos}</div>
                <div className="text-sm text-green-600">Working correctly</div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-200">R2 Videos</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{result.summary.total_r2_videos}</div>
                <div className="text-sm text-red-600">Need migration</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Breakdown by Table:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>post_media</span>
                  <span>
                    <span className="text-green-600">{result.analysis.post_media.stream_videos} Stream</span>
                    {result.analysis.post_media.r2_videos > 0 && (
                      <span className="text-red-600 ml-2">{result.analysis.post_media.r2_videos} R2</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>profile_media</span>
                  <span>
                    <span className="text-green-600">{result.analysis.profile_media.stream_videos} Stream</span>
                    {result.analysis.profile_media.r2_videos > 0 && (
                      <span className="text-red-600 ml-2">{result.analysis.profile_media.r2_videos} R2</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>course_review_media</span>
                  <span>
                    <span className="text-green-600">{result.analysis.course_review_media.stream_videos} Stream</span>
                    {result.analysis.course_review_media.r2_videos > 0 && (
                      <span className="text-red-600 ml-2">{result.analysis.course_review_media.r2_videos} R2</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {result.summary.total_r2_videos > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>Next Steps:</strong> The R2 videos need to be either:
                  <ul className="list-disc list-inside mt-2 ml-4">
                    <li>Re-uploaded to Cloudflare Stream, or</li>
                    <li>Manually mapped to existing Stream video IDs</li>
                  </ul>
                  These videos will show "Failed to load" until migrated.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full"
          variant="outline"
        >
          {isAnalyzing ? "Analyzing URLs..." : "Analyze Video URLs"}
        </Button>
      </CardContent>
    </Card>
  );
}