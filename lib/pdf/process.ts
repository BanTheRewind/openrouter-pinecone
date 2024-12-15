import pdfParse from 'pdf-parse'

export async function processPDF(buffer: Buffer) {
  console.log('Starting PDF processing with pdf-parse...')
  
  try {
    const data = await pdfParse(buffer)
    console.log('PDF processed successfully')

    return {
      documentContent: data.text,
      metadata: {
        pageCount: data.numpages,
        info: {
          title: data.info?.Title || '',
          author: data.info?.Author || '',
          creator: data.info?.Creator || ''
        } as Record<string, unknown>
      }
    }
  } catch (error) {
    console.error('PDF processing error:', error)
    throw new Error(
      `PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
