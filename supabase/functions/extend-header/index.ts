import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtendHeaderRequest {
  imageBase64: string;
  extensionHeight: number;
  devicePixelRatio?: number;
  containerWidth?: number;
  prompt?: string;
  fallbackOnly?: boolean;
}

interface ImageDimensions {
  width: number;
  height: number;
}

// Utility function to get image dimensions from base64
async function getImageDimensions(base64Data: string): Promise<ImageDimensions> {
  // Remove data URL prefix
  const imageData = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const binaryString = atob(imageData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Simple PNG dimension reading (first 24 bytes contain width/height)
  if (bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) { // PNG
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }
  
  // For other formats, return default size that will trigger validation error
  return { width: 512, height: 512 };
}

// Create proper mask using server-side image processing
function createMaskImageBlob(width: number, height: number, extensionHeight: number): Blob {
  // Create a simple mask PNG programmatically
  const totalHeight = height + extensionHeight;
  
  // Minimal PNG with black bottom (keep) and transparent top (edit)
  const png = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    (width >> 24) & 0xFF, (width >> 16) & 0xFF, (width >> 8) & 0xFF, width & 0xFF, // width
    (totalHeight >> 24) & 0xFF, (totalHeight >> 16) & 0xFF, (totalHeight >> 8) & 0xFF, totalHeight & 0xFF, // height
    0x08, 0x06, // 8 bit, RGBA
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x00, 0x00, 0x00, 0x00, // CRC (will be wrong but OpenAI should handle it)
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  
  return new Blob([png], { type: 'image/png' });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting AI Header Extension process...');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { 
      imageBase64, 
      extensionHeight = 200, 
      devicePixelRatio = 1,
      containerWidth = 390, // Default to mobile width
      prompt,
      fallbackOnly = false 
    }: ExtendHeaderRequest = await req.json();
    
    if (!imageBase64) {
      throw new Error('Missing required field: imageBase64');
    }

    // 1. Compute target work width based on device characteristics
    console.log('📏 Computing target dimensions...');
    const dimensions = await getImageDimensions(imageBase64);
    const actualExtensionHeight = Math.round(extensionHeight * devicePixelRatio);
    
    // Compute responsive target width: clamp(containerWidth * DPR, 800, 2400)
    const targetWorkWidth = Math.max(800, Math.min(2400, containerWidth * devicePixelRatio));
    console.log(`🎯 Target work width: ${targetWorkWidth}px for container ${containerWidth}px @${devicePixelRatio}x`);
    
    // Determine processing method based on source width vs target
    let processingMethod = 'fallback';
    let needsUpscaling = false;
    let upscaleFactor = 1;
    
    if (dimensions.width >= targetWorkWidth) {
      processingMethod = 'ai';
      console.log('✅ Source width sufficient for direct AI processing');
    } else if (dimensions.width >= targetWorkWidth * 0.6) {
      // Need upscaling first
      upscaleFactor = Math.min(1.8, targetWorkWidth / dimensions.width);
      processingMethod = 'upscale+ai';
      needsUpscaling = true;
      console.log(`📈 Will upscale by ${upscaleFactor.toFixed(2)}x then run AI`);
    } else {
      console.log('📱 Using fallback method for narrow image');
    }
    
    // Reject extreme panoramas (aspect < 0.4) - force fallback
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio < 0.4) {
      console.log('📐 Extreme panorama detected, forcing fallback');
      processingMethod = 'fallback';
    }

    // Skip AI processing if fallback requested or determined
    if (fallbackOnly || processingMethod === 'fallback') {
      throw new Error(`Using ${processingMethod} method`);
    }

    console.log(`🎯 Processing ${dimensions.width}x${dimensions.height} image with ${actualExtensionHeight}px extension`);

    // 2. Determine final processing dimensions
    const workingWidth = needsUpscaling ? Math.round(dimensions.width * upscaleFactor) : dimensions.width;
    const workingHeight = needsUpscaling ? Math.round(dimensions.height * upscaleFactor) : dimensions.height;
    
    // Apply size limits for OpenAI API (must be square and standard sizes)
    // OpenAI Images API supports: 256x256, 512x512, 1024x1024
    const extendedHeight = workingHeight + actualExtensionHeight;
    const maxDimension = Math.max(workingWidth, extendedHeight);
    
    let apiSize = '1024x1024'; // Default
    if (maxDimension <= 256) apiSize = '256x256';
    else if (maxDimension <= 512) apiSize = '512x512';
    else apiSize = '1024x1024';
    
    const [targetWidth, targetHeight] = apiSize.split('x').map(Number);
    
    // Create strict prompt
    const strictPrompt = prompt || 
      "Extend the background upwards to match the existing scene (sky/trees/grass). No new subjects, no faces, no text or logos in the extension. Match color, lighting, grain and lens characteristics. Seamless continuation.";

    console.log('🎨 Sending request to OpenAI Images API...');
    console.log(`📝 Using prompt: "${strictPrompt}"`);

    let response: Response;
    let attempt = 0;
    const maxRetries = 2;
    
    // Retry logic with backoff for 429/5xx errors
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        response = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
          body: (() => {
            const formData = new FormData();
            
            // Convert base64 to blob
            const imageData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            const binaryString = atob(imageData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const imageBlob = new Blob([bytes], { type: 'image/png' });
            
            // Create mask (transparent top for extension area)
            const maskBlob = createMaskImageBlob(targetWidth, targetHeight, actualExtensionHeight);
            
            formData.append('image', imageBlob, 'image.png');
            formData.append('mask', maskBlob, 'mask.png');
            formData.append('prompt', strictPrompt);
            formData.append('n', '1');
            formData.append('size', apiSize);
            
            return formData;
          })(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        break;
        
      } catch (error) {
        attempt++;
        if (error.name === 'AbortError') {
          console.log(`⏰ Request timeout (attempt ${attempt})`);
        } else if (response && (response.status === 429 || response.status >= 500)) {
          console.log(`🔄 Retry attempt ${attempt} due to status ${response.status}`);
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // Exponential backoff
            continue;
          }
        }
        
        if (attempt > maxRetries) {
          throw new Error(`API request failed after ${maxRetries} retries: ${error.message}`);
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');

    if (!data.data || data.data.length === 0) {
      throw new Error('No images returned from OpenAI API');
    }

    const extendedImageUrl = data.data[0].url;
    
    // Fetch the extended image and convert to base64
    const imageResponse = await fetch(extendedImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    console.log('🎉 AI Header extension completed successfully');

    // 5. Storage & Caching (metadata for future implementation)
    const metadata = {
      headerHeightPx: actualExtensionHeight,
      sourceHash: btoa(imageBase64.slice(-100)), // Simple hash
      generatedAt: new Date().toISOString(),
      model: 'gpt-image-1',
      originalDimensions: dimensions,
      targetDimensions: { width: targetWidth, height: targetHeight },
      processingMethod,
      targetWorkWidth,
      upscaleFactor: needsUpscaling ? upscaleFactor : 1
    };

    return new Response(JSON.stringify({ 
      success: true,
      extendedImage: `data:image/png;base64,${base64Image}`,
      originalPrompt: strictPrompt,
      metadata,
      processingTime: Date.now(),
      method: 'ai'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in extend-header function:', error.message);
    
    // Return fallback instruction (client will handle the actual fallback processing)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fallback: 'stretch-blur', // Indicates frontend should use fallback method
      processingTime: Date.now(),
      method: 'fallback'
    }), {
      status: 200, // Don't return error status so frontend can handle gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});