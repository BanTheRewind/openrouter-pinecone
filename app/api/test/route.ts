import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cookies } from 'next/headers'

console.log('Test route file loaded')

export async function GET(req: Request) {
  console.log('GET handler called')
  try {
    const cookieStore = cookies()
    const session = await auth()
    const openRouterToken = cookieStore.get('openrouter_token')

    // If we have an OpenRouter token, consider the request authenticated
    if (openRouterToken) {
      return NextResponse.json({
        message: 'Test route exists',
        authenticated: true,
        authType: 'openrouter'
      })
    }

    // Fall back to NextAuth session check
    if (session?.user) {
      return NextResponse.json({
        message: 'Test route exists',
        authenticated: true,
        authType: 'nextauth'
      })
    }

    return NextResponse.json(
      {
        error: 'Not authenticated'
      },
      { status: 401 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  console.log('POST handler called')
  try {
    const session = await auth()
    console.log('POST Session:', session)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Test POST received',
      authenticated: true,
      userId: session.user.id
    })
  } catch (error) {
    console.error('POST Auth error:', error)
    return NextResponse.json({ error: 'Auth error' }, { status: 500 })
  }
}
