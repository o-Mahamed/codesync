import { NextResponse } from 'next/server'
import { executeCode } from '@/lib/execution/executor'

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const result = await executeCode(code, language)

    return NextResponse.json({
      output: result.output,
      error: result.error,
      language,
      executionTime: result.executionTime,
      executedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Execution error:', err)
    return NextResponse.json(
      { error: 'Failed to execute code', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
