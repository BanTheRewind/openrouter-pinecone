import { nanoid } from 'nanoid'
import { ErrorMessage } from '@/components/ui/error-message'
import React from 'react'
import { IconUser } from '@/components/ui/icons'

interface Message {
  id: string
  display: React.ReactNode
}

type SetMessagesFunction = (
  updater: (currentMessages: Message[]) => Message[]
) => void

type SubmitUserMessageFunction = (
  message: string,
  modelSlug: string | null,
  openRouterKey: string | null
) => Promise<Message>

export async function handleMessageSubmission(
  message: string,
  modelSlug: string | null,
  openRouterKey: string | null,
  setMessages: SetMessagesFunction,
  submitUserMessage: SubmitUserMessageFunction,
  shouldAppendOptimisticUserMessage: boolean = true
): Promise<void> {
  if (shouldAppendOptimisticUserMessage) {
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: (
          <div className="group relative flex items-start md:-ml-12">
            <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
              <IconUser className="size-4" />
            </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              {typeof message === 'string' ? message : message}
            </div>
          </div>
        )
      }
    ])
  }

  try {
    const responseMessage = await submitUserMessage(
      message,
      modelSlug,
      openRouterKey
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  } catch (error) {
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <ErrorMessage modelSlug={modelSlug} />
      }
    ])
  }
}
