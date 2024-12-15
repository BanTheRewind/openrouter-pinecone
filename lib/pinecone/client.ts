import { Pinecone } from '@pinecone-database/pinecone'
import { DocumentChunk } from '@/lib/types'

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing PINECONE_API_KEY')
}


if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing PINECONE_INDEX_NAME')
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

export interface VectorMetadata extends Record<string, any> {
  documentId: string
  pageNumber: number
  location?: {
    startOffset: number
    endOffset: number
  }
  text: string
}

export async function upsertVectors(chunks: DocumentChunk[]) {
  const vectors = chunks.map(chunk => ({
    id: chunk.id,
    values: chunk.embedding!,
    metadata: {
      documentId: chunk.documentId,
      pageNumber: chunk.metadata.pageNumber,
      location: chunk.metadata.location,
      text: chunk.content
    } as VectorMetadata
  }))

  // Batch upsert in groups of 100
  const batchSize = 100
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize)
    await index.upsert(batch)
  }
}

export async function queryVectors(
  embedding: number[],
  topK: number = 5,
  filter?: { documentId?: string }
) {
  const results = await index.query({
    vector: embedding,
    topK,
    filter: filter,
    includeMetadata: true
  })

  return results.matches.map(match => ({
    score: match.score,
    metadata: match.metadata as VectorMetadata
  }))
}

export async function deleteDocumentVectors(documentId: string) {
  await index.deleteMany({
    filter: {
      documentId: documentId
    }
  })
}
