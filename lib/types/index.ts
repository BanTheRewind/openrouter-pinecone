import { MessageBase } from './ai'

export type Message = MessageBase & {
  id: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, unknown> {
  id: string
  email: string
  password: string
  salt: string
}

export interface Document {
  id: string
  filename: string
  userId: string
  createdAt: Date
  metadata?: {
    pageCount?: number
    author?: string
    createdAt?: Date
  }
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  metadata: {
    pageNumber: number
    startOffset: number
    endOffset: number
  }
  embedding?: number[]
}