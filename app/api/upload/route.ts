import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import PDFParser from 'pdf2json'
import { createChunks } from '@/lib/pdf/chunk'
import { generateEmbeddings } from '@/lib/pdf/embeddings'
import { storeDocument } from '@/lib/pinecone/document-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log('=== POST handler started ===')
  
  try {
    // Auth check
    const cookieStore = cookies()
    const openRouterToken = cookieStore.get('openrouter_token')
    const session = await auth()

    if (!openRouterToken && !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    try {
      // 1. Extract text from PDF
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const pdfParser = new PDFParser()
      const pdfData = await new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', (pdfData) => resolve(pdfData))
        pdfParser.on('pdfParser_dataError', (error) => reject(error))
        pdfParser.parseBuffer(buffer)
      })

      const documentContent = (pdfData as any).Pages
        .map((page: any) => page.Texts
          .map((text: any) => decodeURIComponent(text.R[0].T))
          .join(' ')
        )
        .join('\n')

      // 2. Generate document ID
      const documentId = `doc_${Date.now()}`

      // 3. Create chunks
      console.log('Creating chunks...')
      const chunks = createChunks(documentContent, documentId)
      console.log(`Created ${chunks.length} chunks`)

      // 4. Generate embeddings
      console.log('Generating embeddings...')
      const chunksWithEmbeddings = await generateEmbeddings(chunks)
      console.log('Embeddings generated')

      // 5. Store in Pinecone
      console.log('Storing in Pinecone...')
      await storeDocument(chunksWithEmbeddings)
      console.log('Storage complete')

      return NextResponse.json({
        success: true,
        documentId,
        chunks: chunks.length,
        preview: documentContent.slice(0, 100) // First 100 chars as preview
      })

    } catch (processError) {
      console.error('Processing error:', processError)
      return NextResponse.json({
        error: 'Processing failed',
        details: processError instanceof Error ? processError.message : String(processError)
      }, { status: 422 })
    }

  } catch (error) {
    console.error('Route error:', error)
    return NextResponse.json({ 
      error: 'Request failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
