import { Pinecone } from '@pinecone-database/pinecone'
import { PageEmbedding } from '@/lib/types'

if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone configuration')
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

export async function upsertEmbeddings(
  documentId: string,
  embeddings: PageEmbedding[]
) {
  console.log(`\n=== Pinecone Upload Started ===`)
  console.log(`Total embeddings to upload: ${embeddings.length}`)

  const vectors = embeddings.map(({ pageNumber, embedding, text }, index) => ({
    id: `${documentId}:page:${pageNumber}:chunk:${index}`,
    values: embedding,
    metadata: {
      documentId,
      pageNumber,
      chunkIndex: index,
      totalChunks: embeddings.length,
      text
    }
  }))

  console.log('\n=== Vector IDs Preview ===')
  vectors.slice(0, 3).forEach(v => console.log(`ID: ${v.id}`))
  console.log(`... and ${vectors.length - 3} more\n`)

  const batchSize = 100
  let uploadedCount = 0
  let lastBatchIds: string[] = []

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize)
    try {
      await index.upsert(batch)
      uploadedCount += batch.length
      lastBatchIds = batch.map(v => v.id)
      console.log(`Uploaded batch: ${uploadedCount}/${vectors.length} vectors`)
    } catch (error) {
      console.error(`Failed to upload batch ${i/batchSize + 1}:`, error)
      throw error
    }
  }

  console.log(`\n=== Upload Summary ===`)
  console.log(`Total vectors uploaded: ${uploadedCount}`)
  console.log(`Document ID: ${documentId}`)
  console.log('Last batch IDs:', lastBatchIds.join(', '))
  console.log(`===========================\n`)

  return uploadedCount
}

export async function queryEmbeddings(
  embedding: number[],
  topK = 20
) {
  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true
  })

  return results.matches.map(match => ({
    score: match.score ?? 0,
    metadata: {
      documentId: String(match.metadata?.documentId ?? ''),
      pageNumber: Number(match.metadata?.pageNumber ?? 0),
      text: String(match.metadata?.text ?? '')
    }
  }))
}

