import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';

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
        console.log('Complete request body:', body)
        
        if (!body.uploadId) {
          throw new Error('Missing upload ID')
        }
        
        if (body.totalChunks === undefined || body.totalChunks === null) {
          throw new Error('Missing total chunks count')
        }

        console.log('Completing chunked upload:', body.uploadId)
        console.log('Total chunks expected:', body.totalChunks)
        console.log('User ID:', user.id)
        console.log('File details:', { fileName: body.fileName, fileSize: body.fileSize, fileType: body.fileType })
        
        // Check if file size is within reasonable limits (100MB max for chunked uploads)
        if (body.fileSize > 100 * 1024 * 1024) {
          throw new Error(`File too large: ${body.fileSize} bytes (max 100MB for chunked uploads)`)
        }
        
        let finalUpload: any
        
        try {
          console.log('Starting simple chunk combination...')
          
          // Generate unique filename first
          const timestamp = Date.now()
          const fileExtension = body.fileName.split('.').pop()
          const uniqueFileName = `${user.id}/${timestamp}-${crypto.randomUUID().slice(0, 8)}.${fileExtension}`
          
          // Process chunks in very small batches to avoid memory issues
          const BATCH_SIZE = 3; // Very small batch size
          const allChunkData: Uint8Array[] = []
          
          for (let batchStart = 0; batchStart < body.totalChunks; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, body.totalChunks)
            console.log(`Processing chunk batch ${batchStart}-${batchEnd-1}`)
            
            const batchChunks: Uint8Array[] = []
            
            for (let i = batchStart; i < batchEnd; i++) {
              const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
              console.log(`Downloading chunk ${i}: ${chunkFileName}`)
              
              const { data: chunkData, error } = await supabaseClient.storage
                .from('post-media')
                .download(chunkFileName)
              
              if (error) {
                console.error(`Failed to download chunk ${i}:`, error)
                throw new Error(`Failed to download chunk ${i}: ${error.message}`)
              }
              
              const arrayBuffer = await chunkData.arrayBuffer()
              batchChunks.push(new Uint8Array(arrayBuffer))
              console.log(`Chunk ${i} downloaded, size: ${arrayBuffer.byteLength} bytes`)
            }
            
            // Add batch chunks to main array
            allChunkData.push(...batchChunks)
            
            console.log(`Batch ${batchStart}-${batchEnd-1} completed, total chunks so far: ${allChunkData.length}`)
            
            // Clear batch chunks to free memory
            batchChunks.length = 0
            
            // Force garbage collection if available
            if ('gc' in globalThis && typeof (globalThis as any).gc === 'function') {
              (globalThis as any).gc();
            }
          }

          console.log('All chunks downloaded, combining...')
          
          // Combine all chunks into final file
          const totalSize = allChunkData.reduce((size, chunk) => size + chunk.length, 0)
          console.log(`Combining ${allChunkData.length} chunks, total size: ${totalSize} bytes`)
          
          const combinedFile = new Uint8Array(totalSize)
          let offset = 0
          
          for (let i = 0; i < allChunkData.length; i++) {
            const chunk = allChunkData[i]
            combinedFile.set(chunk, offset)
            offset += chunk.length
            if (i % 5 === 0) {
              console.log(`Combined ${i + 1}/${allChunkData.length} chunks`)
            }
          }
          
          console.log('File combination completed, size:', combinedFile.length)
          
          // Upload final combined file
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('post-media')
            .upload(uniqueFileName, combinedFile, {
              contentType: body.fileType,
              upsert: false
            })

          if (uploadError) {
            console.error('Final upload error:', uploadError)
            throw new Error(`Failed to upload final file: ${uploadError.message}`)
          }
          
          finalUpload = uploadData
          console.log('File upload completed successfully:', finalUpload.path)
        } catch (combineError) {
          const ce = normalizeError(combineError);
          console.error('Error during chunk processing:', ce.name, ce.message, ce.stack)
          throw new Error(`Chunk processing failed: ${ce.message}`)
        }

        // Clean up chunks
        console.log('Cleaning up chunk files...')
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
    const err = normalizeError(error);
    console.error('Chunked upload error:', err.name, err.message, err.stack)
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    })
    return new Response(
      JSON.stringify({ 
        error: err.message,
        success: false,
        details: err.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})