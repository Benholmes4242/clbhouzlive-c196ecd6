import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizeError } from '../_shared/normalize-error.ts';
import { audioFormat, appendPrompt, whisperPrompt } from './audioFormat.ts';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get('Authorization');
    const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = token ? await client.auth.getUser(token) : { data: { user: null }, error: null };
    if (authError || !auth.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { audio, mimeType, prompt } = await req.json();
    const hint = whisperPrompt(prompt);
    
    if (typeof audio !== 'string' || !audio || !/^[A-Za-z0-9+/]*={0,2}$/.test(audio) || (mimeType != null && (typeof mimeType !== 'string' || mimeType.length > 100)) || (prompt != null && typeof prompt !== 'string'))
      return new Response(JSON.stringify({ error: 'Invalid audio or MIME type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    console.log('Received audio data for transcription');

    // Process audio in chunks to prevent memory issues
    function processBase64Chunks(base64String: string, chunkSize = 32768) {
      const chunks: Uint8Array[] = [];
      let position = 0;
      
      while (position < base64String.length) {
        const chunk = base64String.slice(position, position + chunkSize);
        const binaryChunk = atob(chunk);
        const bytes = new Uint8Array(binaryChunk.length);
        
        for (let i = 0; i < binaryChunk.length; i++) {
          bytes[i] = binaryChunk.charCodeAt(i);
        }
        
        chunks.push(bytes);
        position += chunkSize;
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log('Received audio format', { mimeType: mimeType ?? null, bytes: binaryAudio.byteLength });
    const format = audioFormat(mimeType);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: format.mimeType });
    formData.append('file', blob, format.filename);
    formData.append('model', 'whisper-1');
    appendPrompt(formData, hint);

    console.log('Sending audio to OpenAI Whisper API');

    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`Transcription service error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Transcription successful');

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = normalizeError(error);
    console.error('Error in voice-to-text function:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});