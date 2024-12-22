'use client'

import { useCallback, useMemo } from 'react'
import { useQueryState } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useModels } from '@/lib/hooks/use-models'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { TooltipPortal } from '@radix-ui/react-tooltip'
import { useChat } from 'ai/react'

export function ModelSelectContent() {
  const { models, isLoading, error } = useModels()
  const [modelSlug, setModelSlug] = useQueryState('modelSlug', {
    defaultValue: 'openai/gpt-4o-2024-11-20'
  })
  const { reload } = useChat()

  const onValueChange = useCallback(
    (value: string) => {
      setModelSlug(value)
      reload()
    },
    [setModelSlug, reload]
  )

  const modelOptions = useMemo(() => {
    if (isLoading) {
      return [
        <SelectItem key="loading" value="loading" disabled>
          Loading...
        </SelectItem>
      ]
    }
    if (error) {
      return [
        <SelectItem key="error" value="error" disabled>
          Error loading models
        </SelectItem>
      ]
    }
    return models
      .filter(model => !model.id.includes(':'))
      .map(model => (
        <SelectItem key={model.id} value={model.id}>
          {model.name}
        </SelectItem>
      ))
  }, [models, isLoading, error])

  return (
    <Select onValueChange={onValueChange} value={modelSlug ?? ''}>
      <SelectTrigger className="w-full bg-background rounded-lg">
        <SelectValue placeholder="Choose an intelligience provider" />
      </SelectTrigger>
      <SelectContent className="w-full">
        <SelectGroup>
          <SelectLabel className="flex items-center gap-1">
            Featured OpenRouter Tool Calling Models [A-Z]
            <Tooltip delayDuration={0}>
              <TooltipPortal>
                <TooltipContent className="z-50">
                  Different models and providers can offer varying quality and
                  feature parity for tool calling. <br />
                  Learn more:{' '}
                  <a
                    href="https://openrouter.ai/docs/requests"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    OpenRouter Docs
                  </a>
                </TooltipContent>
              </TooltipPortal>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="size-4" />
              </TooltipTrigger>
            </Tooltip>
          </SelectLabel>
          {modelOptions}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
