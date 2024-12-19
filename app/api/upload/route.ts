import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { processPDF } from '@/lib/pdf/process'
import { createChunks } from '@/lib/pdf/chunk'
import { generateEmbeddings } from '@/lib/pdf/embeddings'
import { storeDocument } from '@/lib/pinecone/document-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
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
      const safeFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '_')
      const documentId = `doc_${safeFileName}_${Date.now()}`
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const pages = await processPDF(buffer)
      const chunks = createChunks(pages)
      const embeddings = await generateEmbeddings(chunks)
      await storeDocument(documentId, embeddings)

      return NextResponse.json({
        success: true,
        documentId
      })
    } catch (processError) {
      return NextResponse.json(
        {
          error: 'Processing failed',
          details: processError instanceof Error ? processError.message : String(processError)
        },
        { status: 422 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Request failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
