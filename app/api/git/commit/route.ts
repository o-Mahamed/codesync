import { NextResponse } from 'next/server'

// Language mappings for Piston API
const languageMap: { [key: string]: { language: string, version: string } } = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'java': { language: 'java', version: '15.0.2' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'c': { language: 'c', version: '10.2.0' },
  'csharp': { language: 'csharp', version: '6.12.0' },
  'go': { language: 'go', version: '1.16.2' },
  'rust': { language: 'rust', version: '1.68.2' },
  'ruby': { language: 'ruby', version: '3.0.1' },
  'php': { language: 'php', version: '8.2.3' },
  'swift': { language: 'swift', version: '5.3.3' },
  'kotlin': { language: 'kotlin', version: '1.8.20' },
  'typescript': { language: 'typescript', version: '5.0.3' },
}

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    console.log('=== CODE EXECUTION REQUEST ===')
    console.log('Language:', language)
    console.log('Code length:', code?.length)
    console.log('Using Piston API:', languageMap[language.toLowerCase()] ? 'YES' : 'NO')

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      )
    }

    // Check if language is supported
    const pistonLang = languageMap[language.toLowerCase()]
    
    if (!pistonLang) {
      console.log('Language not supported:', language)
      return NextResponse.json(
        { error: `Language "${language}" is not supported yet` },
        { status: 400 }
      )
    }

    console.log('Calling Piston API with:', pistonLang)

    // Use Piston API for code execution
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [
          {
            name: `main.${getFileExtension(language)}`,
            content: code,
          },
        ],
        stdin: '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    })

    console.log('Piston API response status:', pistonResponse.status)

    if (!pistonResponse.ok) {
      console.error('Piston API failed:', pistonResponse.statusText)
      return NextResponse.json(
        { error: 'Failed to execute code on Piston API' },
        { status: 500 }
      )
    }

    const result = await pistonResponse.json()
    console.log('Piston result:', result)

    // Format the output
    let output = ''
    
    if (result.compile && result.compile.output) {
      output += '=== Compilation Output ===\n' + result.compile.output + '\n\n'
    }

    if (result.run) {
      if (result.run.stdout) {
        output += result.run.stdout
      }
      if (result.run.stderr) {
        output += (output ? '\n' : '') + '=== Errors ===\n' + result.run.stderr
      }
      if (result.run.code !== 0 && result.run.code !== null) {
        output += (output ? '\n' : '') + `\nExit code: ${result.run.code}`
      }
    }

    if (!output.trim()) {
      output = 'Program executed successfully with no output.'
    }

    console.log('Final output:', output)
    return NextResponse.json({ output: output.trim() })
  } catch (error: any) {
    console.error('Execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute code' },
      { status: 500 }
    )
  }
}

function getFileExtension(language: string): string {
  const extensions: { [key: string]: string } = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'go': 'go',
    'rust': 'rs',
    'ruby': 'rb',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kt',
  }
  return extensions[language.toLowerCase()] || 'txt'
}
//