'use client'

import { StreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'

export function BotMessage({
  content
}: {
  content: string | StreamableValue<string>
}) {
  const text = useStreamableText(content)
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex flex-1 space-y-2 overflow-hidden px-1">
        <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
          {text}
        </div>
      </div>
    </div>
  )
}
