import { ParsedPage } from '@/lib/types'

interface ChunkingOptions {
  maxChunkSize?: number
  overlapSize?: number
  minChunkSize?: number
}

export interface Chunk {
  pageNumber: number
  text: string
  metadata: {
    startOffset: number
    endOffset: number
    isStartOfPage: boolean
    isEndOfPage: boolean
  }
}

export function createChunks(
  pages: ParsedPage[],
  options: ChunkingOptions = {}
): Chunk[] {
  const {
    maxChunkSize = 1500,
    overlapSize = 250,
    minChunkSize = 250
  } = options

  const chunks: Chunk[] = []

  for (const page of pages) {
    const text = page.text.trim()
    
    if (!text) {
      continue
    }

    if (text.length <= maxChunkSize) {
      chunks.push({
        pageNumber: page.pageNumber,
        text,
        metadata: {
          startOffset: 0,
          endOffset: text.length,
          isStartOfPage: true,
          isEndOfPage: true
        }
      })
      continue
    }

    let currentPosition = 0
    while (currentPosition < text.length) {
      let endPosition = Math.min(currentPosition + maxChunkSize, text.length)
      
      if (endPosition < text.length) {
        const possibleBreaks = ['. ', '? ', '! ', '\n\n', '. \n', '\n']
        let bestBreak = endPosition

        for (const breakPoint of possibleBreaks) {
          const lastBreak = text.lastIndexOf(
            breakPoint, 
            endPosition
          )
          if (lastBreak > currentPosition && lastBreak < bestBreak) {
            bestBreak = lastBreak + breakPoint.length
          }
        }

        endPosition = bestBreak
      }

      const chunkContent = text.slice(currentPosition, endPosition).trim()
      
      if (chunkContent.length >= minChunkSize) {
        chunks.push({
          pageNumber: page.pageNumber,
          text: chunkContent,
          metadata: {
            startOffset: currentPosition,
            endOffset: endPosition,
            isStartOfPage: currentPosition === 0,
            isEndOfPage: endPosition === text.length
          }
        })
      }

      currentPosition = Math.max(
        currentPosition + 1,
        endPosition - overlapSize
      )
    }
  }

  console.log('\nChunk Statistics:')
  console.log(`Total chunks created: ${chunks.length}`)
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`)
    console.log(`- Page: ${chunk.pageNumber}`)
    console.log(`- Length: ${chunk.text.length} characters`)
    console.log(`- Preview: ${chunk.text.slice(0, 100)}...`)
  })

  return chunks
}
