import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple JavaScript evaluation
    // In production, you should use a sandboxed environment or external API
    
    let output = ''
    
    if (language === 'javascript') {
      try {
        // Capture console.log output
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: any[]) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        }

        // Execute the code
        const result = eval(code)
        
        // Restore console.log
        console.log = originalLog

        // Combine logs and result
        output = logs.join('\n')
        if (result !== undefined) {
          output += (output ? '\n' : '') + String(result)
        }

        if (!output) {
          output = 'Code executed successfully (no output)'
        }
      } catch (error: any) {
        output = `Error: ${error.message}`
      }
    } else if (language === 'python') {
      output = 'Python execution not supported in browser.\nTo run Python code, you need to:\n1. Set up a Python execution service\n2. Use an API like Piston API (https://piston.readthedocs.io/)\n3. Or use a service like Judge0'
    } else if (language === 'java') {
      output = 'Java execution not supported in browser.\nConsider using:\n1. JDoodle API\n2. Judge0 API\n3. Your own Java execution service'
    } else {
      output = `${language} execution is not yet supported.\n\nTo add support:\n1. Use an external API like Piston or Judge0\n2. Set up a dedicated execution service\n3. Integrate with online compilers`
    }

    return NextResponse.json({ output })
  } catch (error: any) {
    console.error('Execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute code' },
      { status: 500 }
    )
  }
}