import { upsertEmbeddings, queryEmbeddings } from './client'
import { generateQueryEmbedding, generateEmbeddings } from '@/lib/pdf/embeddings'
import { PageEmbedding } from '@/lib/types'


/**
 * Processes the PDF buffer, generates embeddings, and stores them in Pinecone.
 */
export async function storeDocument(documentId: string, embeddings: PageEmbedding[]) {
  try {
    await upsertEmbeddings(documentId, embeddings)
    return { success: true }
  } catch (error) {
    console.error('Document storage error:', error)
    throw error
  }
}

export async function searchDocuments(query: string) {
  const embedding = await generateQueryEmbedding(query)
  return await queryEmbeddings(embedding)
}
