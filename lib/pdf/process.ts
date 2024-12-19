import PDFParser from 'pdf2json'
import { ParsedPage } from '@/lib/types'

export async function processPDF(buffer: Buffer): Promise<ParsedPage[]> {
  const pdfParser = new PDFParser()

  return new Promise((resolve, reject) => {
    pdfParser.on('pdfParser_dataReady', pdfData => {
      try {
        console.log('\n=== PDF Processing Started ===')
        console.log(`Total pages detected: ${pdfData.Pages.length}`)

        const pages: ParsedPage[] = pdfData.Pages.map((page: any, index: number) => {
          console.log(`\nProcessing page ${index + 1}:`)
          
          // Group text elements by their Y position to maintain paragraph structure
          const textByLine = new Map<number, string[]>()
          
          page.Texts.forEach((text: any) => {
            if (!text.R?.[0]?.T) return
            
            const y = Math.round(text.y * 10) // Group nearby Y positions
            const decodedText = decodeURIComponent(text.R[0].T)
            
            if (!textByLine.has(y)) {
              textByLine.set(y, [])
            }
            textByLine.get(y)?.push(decodedText)
          })

          // Combine text while preserving structure
          const processedText = Array.from(textByLine.entries())
            .sort(([a], [b]) => a - b) // Sort by Y position
            .map(([_, lineTexts]) => lineTexts.join(' '))
            .join('\n')
            .replace(/([.!?])\s*\n/g, '$1\n\n') // Add paragraph breaks after sentences
            .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
            .trim()

          // Log statistics for verification
          console.log(`- Line groups found: ${textByLine.size}`)
          console.log(`- Characters extracted: ${processedText.length}`)
          console.log(`- Words extracted: ${processedText.split(/\s+/).length}`)
          if (processedText.length > 0) {
            console.log(`- Preview: ${processedText.slice(0, 100)}...`)
          } else {
            console.warn(`- Warning: No text extracted from page ${index + 1}`)
          }

          return {
            pageNumber: index + 1,
            text: processedText
          }
        })

        // Filter and validate results
        const nonEmptyPages = pages.filter(page => page.text.length > 0)
        
        console.log('\n=== PDF Processing Summary ===')
        console.log(`Total pages processed: ${pages.length}`)
        console.log(`Pages with content: ${nonEmptyPages.length}`)
        console.log(`Empty pages: ${pages.length - nonEmptyPages.length}`)
        console.log('===========================\n')

        if (nonEmptyPages.length === 0) {
          throw new Error('No text content extracted from PDF')
        }

        resolve(nonEmptyPages)
      } catch (error) {
        console.error('\n❌ PDF Processing Error:', error)
        reject(error)
      }
    })

    pdfParser.on('pdfParser_dataError', error => {
      console.error('\n❌ PDF Parsing Error:', error)
      reject(error)
    })

    try {
      pdfParser.parseBuffer(buffer)
    } catch (error) {
      console.error('\n❌ Buffer Parsing Error:', error)
      reject(error)
    }
  })
}
