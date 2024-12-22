'use client'

import { useChat, type Message as VercelChatMessage } from 'ai/react'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useState, useMemo, ChangeEvent } from 'react'
import { Message } from '@/lib/types'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import OrbLoader from './orb-loader'
import { TextShimmer } from './ui/text-shimmer'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, className }: ChatProps) {
  const [toolCall, setToolCall] = useState<string>()

  const {
    messages,
    input,
    handleInputChange: vercelHandleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    body: {
      modelSlug: 'anthropic/claude-3.5-sonnet'
    },
    maxToolRoundtrips: 4,
    onToolCall({ toolCall }) {
      setToolCall(toolCall.toolName)
    },
    onFinish() {
      setToolCall(undefined)
    }
  })

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    vercelHandleInputChange(e as ChangeEvent<HTMLInputElement>)
  }

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const currentToolCall = useMemo(() => {
    const tools = messages?.slice(-1)[0]?.toolInvocations
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName
    }
    return undefined
  }, [toolCall, messages])

  const awaitingResponse = useMemo(() => {
    if (isLoading) {
      if (messages.slice(-1)[0]?.role === 'user') {
        return true
      }
      if (messages.slice(-1)[0]?.role === 'assistant' && !messages.slice(-1)[0]?.content) {
        return true
      }
    }
    return false
  }, [isLoading, messages])

  const displayMessages = useMemo(() => {
    return messages.filter(
      message =>
        !(
          message.role === 'assistant' &&
          !message.content &&
          message.toolInvocations
        )
    )
  }, [messages])

  return (
    <div
      className={cn('group w-full overflow-auto', className)}
      ref={scrollRef}
    >
      <div className="pb-[200px] pt-4 md:pt-10" ref={messagesRef}>
        {displayMessages.length ? (
          <>
            <ChatList messages={displayMessages} />
            <AnimatePresence mode="wait">
              {(awaitingResponse || currentToolCall) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative mx-auto max-w-2xl px-4"
                >
                  <div className="flex items-center gap-2 py-4">
                    <OrbLoader />
                    <TextShimmer className="text-sm">
                      {currentToolCall === 'searchDocuments'
                        ? 'Searching documents...'
                        : currentToolCall 
                          ? 'Thinking...'
                          : messages.slice(-1)[0]?.role === 'user'
                            ? 'Thinking...'
                            : 'Generating response...'}
                    </TextShimmer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  )
}
