import { NextResponse } from 'next/server'
import { VM } from 'vm2'

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
        // Create a sandboxed VM
        const vm = new VM({
          timeout: 5000, // 5 second timeout
          sandbox: {
            console: {
              log: (...args: any[]) => {
                output += args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n'
              },
              error: (...args: any[]) => {
                output += 'ERROR: ' + args.map(arg => String(arg)).join(' ') + '\n'
              },
              warn: (...args: any[]) => {
                output += 'WARN: ' + args.map(arg => String(arg)).join(' ') + '\n'
              }
            }
          }
        })

        // Run the code
        const result = vm.run(code)
        
        // If there's a return value, add it to output
        if (result !== undefined) {
          output += `\nReturn value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
        output += `\n❌ Error: ${error}`
      }
    } else if (language === 'python') {
      // For Python, we'll need to call an external service or use a different approach
      // For now, return a message
      output = '🐍 Python execution coming soon! For now, only JavaScript is supported.'
      error = 'Python execution not yet implemented'
    } else {
      output = `⚠️ Language "${language}" is not supported yet. Only JavaScript is currently available.`
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
