import { streamText, tool } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { auth } from '@/auth'
import { nanoid, openRouterAPIBaseUrl } from '@/lib/utils'
import { searchDocuments } from '@/lib/pinecone/document-service'
import { z } from 'zod'
import { cookies } from 'next/headers'

const defaultModelSlug = 'anthropic/claude-3.5-sonnet'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const openRouterToken = cookieStore.get('openrouter_token')
    const session = await auth()

    if (!openRouterToken && !session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, modelSlug } = await req.json()

    const openrouter = createOpenRouter({
      baseURL: openRouterAPIBaseUrl + '/api/v1/',
      apiKey: openRouterToken?.value ?? process.env.OPENROUTER_API_KEY
    })

    const result = await streamText({
      model: openrouter(modelSlug || defaultModelSlug),
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant with access to a searchDocuments tool that can search through PDF documents.
          IMPORTANT: Do not generate ANY response text until after you receive search results.
          For each user message:
          1. First use the searchDocuments tool to find relevant information
          2. Wait for the search results to complete
          3. Only then begin generating your response based on the search results
          4. Always cite specific sources using [Source: Page X] format
          
          If no relevant information is found, wait for search completion before saying so.
          Do not explain your process - just use the tools and answer the question.`
        },
        ...messages
      ],
      tools: {
        searchDocuments: tool({
          description: 'Search through PDF documents',
          parameters: z.object({
            query: z.string().describe('Search query to find relevant passages')
          }),
          execute: async ({ query }) => {
            const searchResults = await searchDocuments(query)
            return searchResults
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 7) // Limit to top 7 results
              .map(result => ({
                text: result.metadata.text,
                source: `Page ${result.metadata.pageNumber}`,
                score: result.score
              }))
              .filter(result => result.score > 0.3) // Only highly relevant results
              .map(ctx => `[Source: Page ${ctx.source}] ${ctx.text}`)
              .join('\n\n')
          }
        })
      }
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500
    })
  }
}
