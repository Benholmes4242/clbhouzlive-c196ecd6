import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChunkUploadRequest {
  action: 'initiate' | 'upload-chunk' | 'complete'
  fileName: string
  fileSize: number
  fileType: string
  chunkIndex?: number
  totalChunks?: number
  uploadId?: string
  chunkData?: string // base64 encoded chunk
}

interface UploadSession {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  totalChunks: number
  uploadedChunks: string[]
  userId: string
  createdAt: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const body: ChunkUploadRequest = await req.json()
    console.log('Chunked upload request:', body.action, body.fileName)

    switch (body.action) {
      case 'initiate': {
        // Create upload session
        const uploadId = crypto.randomUUID()
        const session: UploadSession = {
          id: uploadId,
          fileName: body.fileName,
          fileSize: body.fileSize,
          fileType: body.fileType,
          totalChunks: body.totalChunks || 0,
          uploadedChunks: [],
          userId: user.id,
          createdAt: new Date().toISOString()
        }

        // Store session in a temporary storage (you could use a database table for this)
        // For now, we'll return the session info to be managed client-side
        
        console.log('Upload session initiated:', uploadId)
        return new Response(
          JSON.stringify({ 
            success: true, 
            uploadId,
            session 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      case 'upload-chunk': {
        if (!body.chunkData || body.chunkIndex === undefined || !body.uploadId) {
          throw new Error('Missing chunk data, index, or upload ID')
        }

        // Decode base64 chunk data
        const chunkBuffer = Uint8Array.from(atob(body.chunkData), c => c.charCodeAt(0))
        
        // Create unique chunk file name
        const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${body.chunkIndex.toString().padStart(4, '0')}`
        
        // Upload chunk to storage
        const { data, error } = await supabaseClient.storage
          .from('post-media')
          .upload(chunkFileName, chunkBuffer, {
            contentType: 'application/octet-stream',
            upsert: true
          })

        if (error) {
          console.error('Chunk upload error:', error)
          throw new Error(`Failed to upload chunk: ${error.message}`)
        }

        console.log(`Chunk ${body.chunkIndex} uploaded successfully`)
        return new Response(
          JSON.stringify({ 
            success: true, 
            chunkIndex: body.chunkIndex,
            chunkPath: data.path
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      case 'complete': {
        if (!body.uploadId || body.totalChunks === undefined) {
          throw new Error('Missing upload ID or total chunks')
        }

        console.log('Completing chunked upload:', body.uploadId)
        
        // Download and combine all chunks
        const chunks: Uint8Array[] = []
        
        for (let i = 0; i < body.totalChunks; i++) {
          const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
          
          const { data: chunkData, error } = await supabaseClient.storage
            .from('post-media')
            .download(chunkFileName)
          
          if (error) {
            console.error(`Failed to download chunk ${i}:`, error)
            throw new Error(`Failed to download chunk ${i}: ${error.message}`)
          }
          
          const arrayBuffer = await chunkData.arrayBuffer()
          chunks.push(new Uint8Array(arrayBuffer))
        }

        // Combine chunks into final file
        const totalSize = chunks.reduce((size, chunk) => size + chunk.length, 0)
        const combinedFile = new Uint8Array(totalSize)
        let offset = 0
        
        for (const chunk of chunks) {
          combinedFile.set(chunk, offset)
          offset += chunk.length
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now()
        const fileExtension = body.fileName.split('.').pop()
        const uniqueFileName = `${user.id}/${timestamp}-${crypto.randomUUID().slice(0, 8)}.${fileExtension}`

        // Upload final combined file
        const { data: finalUpload, error: uploadError } = await supabaseClient.storage
          .from('post-media')
          .upload(uniqueFileName, combinedFile, {
            contentType: body.fileType,
            upsert: false
          })

        if (uploadError) {
          console.error('Final upload error:', uploadError)
          throw new Error(`Failed to upload final file: ${uploadError.message}`)
        }

        // Clean up chunks
        for (let i = 0; i < body.totalChunks; i++) {
          const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
          await supabaseClient.storage
            .from('post-media')
            .remove([chunkFileName])
        }

        // Get public URL
        const { data: publicUrlData } = supabaseClient.storage
          .from('post-media')
          .getPublicUrl(finalUpload.path)

        console.log('Chunked upload completed successfully:', finalUpload.path)
        
        return new Response(
          JSON.stringify({ 
            success: true,
            filePath: finalUpload.path,
            publicUrl: publicUrlData.publicUrl,
            fileName: body.fileName,
            fileSize: body.fileSize,
            fileType: body.fileType
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Chunked upload error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})