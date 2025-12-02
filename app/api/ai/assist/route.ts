import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code, language, prompt } = await request.json()

    if (!code || !prompt) {
      return NextResponse.json(
        { error: 'Code and prompt are required' },
        { status: 400 }
      )
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file',
          setup: 'Get your free API key at: https://console.anthropic.com/'
        },
        { status: 500 }
      )
    }

    console.log('🤖 AI Request:', prompt.substring(0, 50) + '...')

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a helpful coding assistant. Here is some ${language} code:

\`\`\`${language}
${code}
\`\`\`

${prompt}

Please provide a clear, concise response. If suggesting code improvements, provide the complete updated code in a code block.`
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Claude API error:', error)
      return NextResponse.json(
        { error: 'Failed to get AI response: ' + (error.error?.message || 'Unknown error') },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ AI Response received')

    // Extract response text
    const aiResponse = data.content[0].text

    // Try to extract code block if present
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/
    const codeMatch = aiResponse.match(codeBlockRegex)
    const suggestedCode = codeMatch ? codeMatch[1] : null

    return NextResponse.json({
      response: aiResponse,
      suggestedCode
    })

  } catch (error: any) {
    console.error('AI assist error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request: ' + error.message },
      { status: 500 }
    )
  }
}