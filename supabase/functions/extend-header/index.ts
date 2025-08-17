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
  prompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting header extension process...');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { imageBase64, extensionHeight = 200, prompt }: ExtendHeaderRequest = await req.json();
    
    if (!imageBase64) {
      throw new Error('Missing required field: imageBase64');
    }

    console.log(`Extending header by ${extensionHeight}px`);

    // Create the extension prompt
    const defaultPrompt = `Extend this image upward seamlessly. Add more background content (sky, trees, buildings, landscape elements) that naturally continues the existing scene. Do not add new people, faces, or main subjects. Focus only on extending the background environment. Make the transition completely natural and undetectable. Maintain the same lighting, style, and atmosphere as the original image.`;
    
    const finalPrompt = prompt || defaultPrompt;

    console.log('Sending request to OpenAI Images API...');

    // Use OpenAI's edit image endpoint to extend the image
    const response = await fetch('https://api.openai.com/v1/images/edits', {
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
        
        // Create a simple mask (transparent top area for extension)
        // For now, we'll create a basic mask - in production you'd want more sophisticated masking
        const canvas = new OffscreenCanvas(1024, 1024 + extensionHeight);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create mask with transparent top area
          ctx.fillStyle = 'rgba(0,0,0,1)'; // Opaque (keep original)
          ctx.fillRect(0, extensionHeight, 1024, 1024); // Bottom part
          ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent (extend here)
          ctx.fillRect(0, 0, 1024, extensionHeight); // Top part to extend
        }
        
        const maskBlob = canvas.convertToBlob({ type: 'image/png' });
        
        formData.append('image', imageBlob, 'image.png');
        formData.append('mask', maskBlob, 'mask.png');
        formData.append('prompt', finalPrompt);
        formData.append('n', '1');
        formData.append('size', '1024x1024');
        
        return formData;
      })(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');

    if (!data.data || data.data.length === 0) {
      throw new Error('No images returned from OpenAI API');
    }

    const extendedImageUrl = data.data[0].url;
    
    // Fetch the extended image and convert to base64
    const imageResponse = await fetch(extendedImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    console.log('Header extension completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      extendedImage: `data:image/png;base64,${base64Image}`,
      originalPrompt: finalPrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extend-header function:', error);
    
    // Return fallback suggestion
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fallback: 'stretch-blur' // Indicates frontend should use fallback method
    }), {
      status: 200, // Don't return error status so frontend can handle gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});