import React from 'react';
import { HeaderExtensionUpload } from '@/components/profile/HeaderExtensionUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Zap, Shield, Layers } from 'lucide-react';

const HeaderExtensionDemo = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Header Extension
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform any image into a perfect header background using advanced AI content-aware extension.
            Seamlessly extends backgrounds upward with intelligent blending and fallback support.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                AI-Powered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses OpenAI's gpt-image-1 model for intelligent background extension that understands scene context.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Seamless Blending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatic 8-16px feathering and 1-2% monochrome noise layer for professional, banding-free results.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Fallback Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatic fallback to stretch+blur method if AI processing fails, ensuring you always get results.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Video Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Foundation for video header extension using first-frame processing with optional keyframe upgrades.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Upload Component */}
        <HeaderExtensionUpload />

        {/* Technical Details */}
        <div className="mt-12 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">AI Extension Process</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Upload image and specify extension height</li>
                    <li>Create transparent mask for top extension area</li>
                    <li>AI analyzes scene and extends background naturally</li>
                    <li>Apply feathering and noise reduction for seamless blend</li>
                    <li>Return professional-grade header-ready image</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Fallback Method</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Extract top 10% slice of original image</li>
                    <li>Apply 12px blur and saturation boost</li>
                    <li>Stretch slice to fill extension area</li>
                    <li>Add 16px feathering at join line</li>
                    <li>Apply 2% monochrome noise for texture</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Use Cases & Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Website Headers</h4>
                  <p className="text-sm text-muted-foreground">
                    Transform profile photos or landscape images into perfect website header backgrounds that extend naturally.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Social Media</h4>
                  <p className="text-sm text-muted-foreground">
                    Create cover images for social profiles by extending existing photos to fit various aspect ratios.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Design Assets</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate design-ready background assets from source images for presentations, banners, and marketing materials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeaderExtensionDemo;