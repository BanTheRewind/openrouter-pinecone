import { toast } from 'sonner'
import { Message } from 'ai'

export async function handleMessageSubmission(
  message: string,
  modelSlug: string | null,
  openRouterKey: string,
  setMessages: any
) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        modelSlug
      })
    })

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No reader available')
    }

    let accumulatedMessage = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      accumulatedMessage += chunk

      setMessages((currentMessages: Message[]) => [
        ...currentMessages,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: accumulatedMessage
        }
      ])
    }

  } catch (error) {
    console.error('Error:', error)
    toast.error('An error occurred while sending your message')
  }
}
