import { Message as AIMessage } from 'ai'

export interface Message extends AIMessage {
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

export interface ParsedPage {
  pageNumber: number
  text: string
}

export interface PageEmbedding {
  pageNumber: number
  embedding: number[]
  text: string
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