import OpenAI from 'openai'
import { PageEmbedding } from '@/lib/types'
import { Chunk } from './chunk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })
  return response.data[0].embedding
}

export async function generateEmbeddings(chunks: Chunk[]): Promise<PageEmbedding[]> {
  try {
    console.log(`Generating embeddings for ${chunks.length} chunks`)
    const embeddings: PageEmbedding[] = []
    for (const chunk of chunks) {
      console.log(`Processing chunk from page ${chunk.pageNumber}, text length: ${chunk.text.length}`)
      const embedding = await createEmbedding(chunk.text)
      embeddings.push({
        pageNumber: chunk.pageNumber,
        embedding,
        text: chunk.text
      })
    }
    console.log(`Generated ${embeddings.length} embeddings`)
    return embeddings
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return createEmbedding(query)
}
