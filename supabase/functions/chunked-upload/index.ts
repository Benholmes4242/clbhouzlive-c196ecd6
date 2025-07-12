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
        
        // Check if file size is within reasonable limits (100MB max)
        if (body.fileSize > 100 * 1024 * 1024) {
          throw new Error(`File too large: ${body.fileSize} bytes (max 100MB)`)
        }
        
        try {
          // First verify all chunks exist before starting
          console.log('Verifying all chunks exist...')
          for (let i = 0; i < body.totalChunks; i++) {
            const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
            const { data: exists, error: listError } = await supabaseClient.storage
              .from('post-media')
              .list(`${user.id}/chunks/${body.uploadId}`, {
                search: `chunk_${i.toString().padStart(4, '0')}`
              })
            
            if (listError || !exists || exists.length === 0) {
              throw new Error(`Chunk ${i} not found or verification failed`)
            }
          }
          console.log('All chunks verified to exist')

          // Stream chunks directly to final file to avoid memory issues
          console.log('Starting streaming combination...')
          
          // Calculate total size first
          let totalSize = 0
          for (let i = 0; i < body.totalChunks; i++) {
            const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
            const { data: chunkInfo } = await supabaseClient.storage
              .from('post-media')
              .list(`${user.id}/chunks/${body.uploadId}`, {
                search: `chunk_${i.toString().padStart(4, '0')}`
              })
            
            if (chunkInfo && chunkInfo[0]) {
              totalSize += chunkInfo[0].metadata?.size || 0
            }
          }
          
          console.log(`Total expected size: ${totalSize} bytes`)
          
          // Create final file buffer
          const combinedFile = new Uint8Array(totalSize || body.fileSize)
          let offset = 0
          
          // Stream each chunk individually to avoid memory overflow
          for (let i = 0; i < body.totalChunks; i++) {
            const chunkFileName = `${user.id}/chunks/${body.uploadId}/chunk_${i.toString().padStart(4, '0')}`
            console.log(`Processing chunk ${i}/${body.totalChunks - 1}`)
            
            const { data: chunkData, error } = await supabaseClient.storage
              .from('post-media')
              .download(chunkFileName)
            
            if (error) {
              console.error(`Failed to download chunk ${i}:`, error)
              throw new Error(`Failed to download chunk ${i}: ${error.message}`)
            }
            
            const arrayBuffer = await chunkData.arrayBuffer()
            const chunkArray = new Uint8Array(arrayBuffer)
            
            // Set chunk data in final file
            combinedFile.set(chunkArray, offset)
            offset += chunkArray.length
            
            console.log(`Chunk ${i} processed, size: ${arrayBuffer.byteLength} bytes, offset: ${offset}`)
            
            // Clear chunk data immediately to free memory
            chunkData = null
          }
          
          console.log(`File combination completed, final size: ${combinedFile.length} bytes`)
        } catch (combineError) {
          console.error('Error during chunk processing:', combineError)
          throw new Error(`Chunk processing failed: ${combineError.message}`)
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})