// lib/chat/actions.tsx
'use server'
import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue,
  StreamableValue
} from 'ai/rsc'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { BotMessage } from '@/components/bot-message'
import { IconUser } from '@/components/ui/icons'
import { nanoid, openRouterAPIBaseUrl, mistralNanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { APICallError, CoreMessage } from 'ai'
import { searchDocuments } from '@/lib/pinecone/document-service'
import { OpenAI } from 'openai'
import OrbLoader from '@/components/orb-loader'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { tool } from 'ai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function SystemMessage({
  children
}: {
  children: React.ReactNode
}) {
  'use server'
  return (
    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
      <span className="bg-muted p-1 rounded">{children}</span>
    </div>
  )
}

const defaultModelSlug = 'anthropic/claude-3.5-sonnet'
const defaultErrorMessage = 'An error occurred while processing your request.'
const systemMessage = `\
You are a helpful AI assistant with access to a searchDocuments tool that can search through PDF documents.
When a user asks a question, you MUST:
1. Use the searchDocuments tool to find relevant information
2. Wait for the search results
3. Provide an answer based on the search results
4. Always cite specific sources from the documents using the [Source: Page X] format

If you don't find relevant information in the search results, say so clearly.
Do not explain your process or capabilities - just use the tools and answer the question.`

function isAPICallError(error: unknown): error is APICallError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    'responseBody' in error
  )
}

const getErrorMessage = (error: unknown): string => {
  if (isAPICallError(error)) {
    return error.responseBody || error.message || defaultErrorMessage
  }
  return defaultErrorMessage
}

function isMistralModel(modelSlug?: string): boolean {
  return modelSlug === 'mistralai/mistral-large'
}

function isGeminiModel(modelSlug?: string): boolean {
  return (
    modelSlug === 'google/gemini-flash-1.5' ||
    modelSlug === 'google/gemini-pro-1.5'
  )
}

function isCohereModel(modelSlug?: string): boolean {
  return modelSlug === 'cohere/command-r-plus-08-2024'
}

function shouldAddDummyAssistantMessage(modelSlug?: string): boolean {
  return (
    isMistralModel(modelSlug) ||
    isGeminiModel(modelSlug) ||
    isCohereModel(modelSlug)
  )
}

function getToolCallId(modelSlug?: string): string {
  return isMistralModel(modelSlug) ? mistralNanoid() : nanoid()
}

interface SearchResult {
  text: string
  source: string
  score: number
}

interface SearchDocumentTool {
  parameters: z.ZodObject<{
    query: z.ZodString
  }>
  generate: (
    args: z.infer<typeof searchDocumentsParams>,
    context: { toolName: string; toolCallId: string }
  ) => AsyncGenerator<JSX.Element>
}

const searchDocumentsParams = z.object({
  query: z
    .string()
    .describe('The search query to find relevant document passages')
})

const searchDocumentsTool: SearchDocumentTool = {
  parameters: searchDocumentsParams,
  generate: async function* (
    { query }: z.infer<typeof searchDocumentsParams>,
    { toolName, toolCallId }: { toolName: string; toolCallId: string }
  ) {
    console.log('Tool generate called with query:', query)
    const searchResults = await searchDocuments(query)
    console.log('Search results:', searchResults)

    const results: SearchResult[] = searchResults
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map(result => ({
        text: result.metadata.text,
        source: `Page ${result.metadata.pageNumber}`,
        score: result.score
      }))

    const contextText = results
      .map(ctx => `[Source: Page ${ctx.source}] ${ctx.text}`)
      .join('\n\n')

    console.log('About to yield:', contextText)
    yield <BotMessage content={contextText} />
  }
}

async function submitUserMessage(
  content: string,
  modelSlug?: string,
  openRouterKey?: string
) {
  'use server'
  const aiState = getMutableAIState<typeof AI>()
  let textStream: ReturnType<typeof createStreamableValue<string>> | undefined
  let textNode: React.ReactNode | undefined

  try {
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      })),
      {
        role: 'user',
        content: content
      }
    ] satisfies CoreMessage[]

    const openrouter = createOpenRouter({
      baseURL: openRouterAPIBaseUrl + '/api/v1/',
      apiKey: openRouterKey ?? process.env.OPENROUTER_API_KEY
    })

    const model = openrouter(modelSlug || defaultModelSlug)

    const result = await streamUI({
      model,
      messages,
      tools: {
        searchDocuments: searchDocumentsTool
      },
      toolChoice: {
        type: 'tool',
        toolName: 'searchDocuments'
      },
      initial: (
        <div className="flex items-center gap-2">
          <OrbLoader />
          <TextShimmer>Thinking...</TextShimmer>
        </div>
      ),
      text: async ({ content, done, delta }) => {
        try {
          console.log('Text callback received:', { content, done, delta })

          if (!textStream) {
            textStream = createStreamableValue('')
            textNode = <BotMessage content={textStream.value} />
            console.log('Created new text stream')
          }

          if (done) {
            console.log('Stream done, final content:', content)
            textStream.update(content)
            textStream.done()
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content
                }
              ]
            })
          } else {
            console.log('Updating stream with delta:', delta)
            textStream.update(delta)
          }

          return textNode
        } catch (error) {
          console.error('Error in text callback:', error)
          textStream?.done()
          throw error
        }
      }
    })

    return {
      id: nanoid(),
      display: result.value
    }
  } catch (error) {
    textStream?.done()
    const errorMessage = getErrorMessage(error)
    return {
      id: nanoid(),
      display: <BotMessage content={errorMessage} />
    }
  } finally {
    textStream?.done()
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'
    const session = await auth()
    if (session?.user) {
      const aiState = getAIState() as Chat
      if (aiState) {
        return getUIStateFromAIState(aiState)
      }
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'
    const session = await auth()
    if (session?.user) {
      const { chatId, messages } = state
      const chat: Chat = {
        id: chatId,
        title:
          (messages[0]?.content as string)?.substring(0, 100) || 'New Chat',
        userId: session.user.id,
        createdAt: new Date(),
        messages,
        path: `/chat/${chatId}`
      }
      await saveChat(chat)
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <div className="group relative flex items-start md:-ml-12">
            <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
              <IconUser className="size-4" />
            </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              {typeof message.content === 'string'
                ? message.content
                : message.content.map(part =>
                    'text' in part ? part.text : null
                  )}
            </div>
          </div>
        ) : message.role === 'assistant' ? (
          <BotMessage content={message.content as string} />
        ) : null
    }))
}
