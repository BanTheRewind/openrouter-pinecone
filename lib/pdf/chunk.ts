import { DocumentChunk } from '@/lib/types'

interface ChunkingOptions {
  maxChunkSize?: number
  overlapSize?: number
  minChunkSize?: number
}

export function createChunks(
  text: string,
  documentId: string,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  console.log('Starting chunking process...')
  console.log('Text length:', text.length)

  const {
    maxChunkSize = 1500,
    overlapSize = 200,
    minChunkSize = 500
  } = options;

  const chunks: DocumentChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < text.length) {
    let endPosition = Math.min(currentPosition + maxChunkSize, text.length);
    
    // Handle the final chunk differently
    if (text.length - currentPosition < maxChunkSize) {
      // If remaining text is too small, append to last chunk or create final chunk
      const remainingText = text.slice(currentPosition).trim();
      
      if (chunks.length > 0 && remainingText.length < minChunkSize) {
        // Append to last chunk
        const lastChunk = chunks[chunks.length - 1];
        lastChunk.content += ' ' + remainingText;
        lastChunk.metadata.endOffset = text.length;
        console.log('Appended final text to last chunk');
      } else {
        // Create final chunk
        chunks.push({
          id: `${documentId}:chunk:${chunkIndex}`,
          documentId,
          content: remainingText,
          metadata: {
            pageNumber: 1,
            startOffset: currentPosition,
            endOffset: text.length
          }
        });
        console.log('Created final chunk');
      }
      break; // Exit the loop
    }

    // Normal chunk processing
    const chunkContent = text.slice(currentPosition, endPosition).trim();
    
    if (chunkContent.length >= minChunkSize) {
      chunks.push({
        id: `${documentId}:chunk:${chunkIndex}`,
        documentId,
        content: chunkContent,
        metadata: {
          pageNumber: 1,
          startOffset: currentPosition,
          endOffset: endPosition
        }
      });
      chunkIndex++;
      currentPosition = endPosition - overlapSize;
    } else {
      currentPosition = endPosition;
    }
  }

  console.log('Chunking complete. Total chunks:', chunks.length);
  return chunks;
}
