import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    let output = ''
    let error = null

    if (language === 'javascript') {
      try {
        // Capture console output
        const logs: string[] = []
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '))
          },
          error: (...args: any[]) => {
            logs.push('ERROR: ' + args.map(arg => String(arg)).join(' '))
          },
          warn: (...args: any[]) => {
            logs.push('WARN: ' + args.map(arg => String(arg)).join(' '))
          }
        }

        // Create a function with the code
        const fn = new Function('console', code)
        
        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Execution timeout (5 seconds)')), 5000)
        })
        
        const executePromise = Promise.resolve(fn(customConsole))
        
        const result = await Promise.race([executePromise, timeoutPromise])
        
        output = logs.join('\n')
        
        if (result !== undefined) {
          output += `\n\nReturn value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
        }

        if (!output) {
          output = '(No output - code executed successfully)'
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
        output = `❌ Error: ${error}`
      }
    } else if (language === 'python') {
      output = '🐍 Python execution coming soon! Only JavaScript is currently supported.'
      error = 'Python not yet implemented'
    } else {
      output = `⚠️ Language "${language}" is not supported. Only JavaScript is available.`
      error = 'Unsupported language'
    }

    return NextResponse.json({
      output: output || '(No output)',
      error,
      language,
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
