import OpenAI from 'openai'
import { DocumentChunk } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmbeddings(
  chunks: DocumentChunk[]
): Promise<DocumentChunk[]> {
  try {
    const batchSize = 100 // OpenAI recommends batching
    const embeddedChunks: DocumentChunk[] = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(chunk => chunk.content)
      })

      const embeddedBatch = batch.map((chunk, index) => ({
        ...chunk,
        embedding: response.data[index].embedding
      }))

      embeddedChunks.push(...embeddedBatch)
    }

    return embeddedChunks
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error('Failed to generate embeddings')
  }
}
