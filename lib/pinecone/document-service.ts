import { OpenAI } from 'openai'
import { Document, DocumentChunk } from '@/lib/types'
import { deleteDocumentVectors, queryVectors, upsertVectors } from './client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function storeDocument(chunks: DocumentChunk[]) {
  // Generate embeddings for chunks that don't have them
  const chunksToEmbed = chunks.filter(chunk => !chunk.embedding)

  if (chunksToEmbed.length > 0) {
    const embeddings = await Promise.all(
      chunksToEmbed.map(async chunk => {
        const response = await openai.embeddings.create({
          input: chunk.content,
          model: 'text-embedding-3-small'
        })
        return response.data[0].embedding
      })
    )

    // Attach embeddings to chunks
    chunksToEmbed.forEach((chunk, i) => {
      chunk.embedding = embeddings[i]
    })
  }

  // Store vectors in Pinecone
  await upsertVectors(chunks)
}

export async function searchDocuments(
  query: string,
  documentId?: string,
  topK: number = 5
) {
  // Generate embedding for query
  const response = await openai.embeddings.create({
    input: query,
    model: 'text-embedding-3-small'
  })
  const queryEmbedding = response.data[0].embedding

  // Search vectors
  const results = await queryVectors(
    queryEmbedding,
    topK,
    documentId ? { documentId } : undefined
  )

  return results
}

export async function deleteDocument(documentId: string) {
  await deleteDocumentVectors(documentId)
}
