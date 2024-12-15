// lib/chat/actions.tsx
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

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
      <span className="bg-muted p-1 rounded">{children}</span>
    </div>
  )
}

const defaultModelSlug = 'anthropic/claude-3.5-sonnet'
const defaultErrorMessage = 'An error occurred while processing your request.'
const systemMessage = `\
You are a helpful AI assistant that can answer questions about uploaded PDF documents.
You will receive context from the documents to help answer user queries accurately.
Always cite the specific parts of the documents you're referencing in your answers.
If you don't find relevant information in the provided context, say so clearly.`

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

async function submitUserMessage(
  content: string,
  modelSlug?: string,
  openRouterKey?: string
) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const prevConversation = aiState.get().messages
  const userMessage = {
    id: nanoid(),
    role: 'user',
    content
  } satisfies Message

  aiState.update({
    ...aiState.get(),
    messages: [...prevConversation, userMessage]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const openrouter = createOpenRouter({
    baseURL: openRouterAPIBaseUrl + '/api/v1/',
    apiKey: openRouterKey ?? process.env.OPENROUTER_API_KEY
  })

  const model = openrouter(modelSlug || defaultModelSlug)
  const messages = [
    {
      role: 'system',
      content: systemMessage
    },
    ...aiState.get().messages.map((message: any) => ({
      role: message.role,
      content: message.content,
      name: message.name
    }))
  ] satisfies CoreMessage[]

  try {
    const result = await streamUI({
      model,
      initial: (
        <div className="flex gap-2">
          <div className="animate-spin">⌛</div> Thinking...
        </div>
      ),
      messages,
      text: ({ content, done, delta }) => {
        if (!textStream) {
          textStream = createStreamableValue('')
          textNode = <BotMessage content={textStream.value} />
        }

        if (done) {
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
          textStream.update(delta)
        }

        return textNode
      }
    })

    return {
      id: nanoid(),
      display: result.value
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    return {
      id: nanoid(),
      display: <BotMessage content={errorMessage} />
    }
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
        title: (messages[0]?.content as string)?.substring(0, 100) || 'New Chat',
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
