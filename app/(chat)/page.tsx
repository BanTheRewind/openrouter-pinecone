import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'


export const metadata = {
  title: 'New Chat'
}

export default async function IndexPage() {
  const id = nanoid()

  return (
      <Chat id={id} />
  )
}
