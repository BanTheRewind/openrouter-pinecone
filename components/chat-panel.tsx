'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ModelSelectContent } from '@/components/model-select'
import { Suspense } from 'react'
import { SelectValue } from '@/components/ui/select'
import { useOpenRouterAuth } from '@/app/openrouter-auth-provider'
import ErrorBoundary from '@/components/error-boundary'
import { useQueryState } from 'nuqs'
import { ChangeEvent } from 'react'

export interface ChatPanelProps {
  id?: string
  input: string
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const { openRouterKey, setIsDialogOpen } = useOpenRouterAuth()
  const [modelSlug, _] = useQueryState('modelSlug')

  return (
    <div className="fixed bottom-4 inset-x-[4%] mx-auto max-w-2xl backdrop-blur-lg bg-gradient-to-b from-muted/10 from-0% to-muted/10 to-50% duration-300 ease-in-out animate-in dark:from-background/5 dark:from-10% dark:to-background/20 rounded-xl">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
      <div className="space-y-4 border-t bg-background/80 px-4 py-2 shadow-lg rounded-xl sm:border md:py-4">
        <Suspense fallback={<SelectValue placeholder="Loading models..." />}>
          <ModelSelectContent />
        </Suspense>
        <ErrorBoundary
          fallback={<div>Something went wrong. Please refresh the page.</div>}
        >
          <PromptForm
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </ErrorBoundary>
        <FooterText className="hidden sm:block" />
      </div>
    </div>
  )
}
