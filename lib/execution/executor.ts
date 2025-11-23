import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

interface ExecutionResult {
  output: string
  error: string | null
  executionTime: number
}

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  
  try {
    switch (language) {
      case 'javascript':
        return await executeJavaScript(code)
      case 'typescript':
        return await executeTypeScript(code)
      case 'python':
        return await executePython(code)
      case 'java':
        return await executeJava(code)
      case 'cpp':
        return await executeCpp(code)
      case 'go':
        return await executeGo(code)
      default:
        return {
          output: '',
          error: `Language ${language} is not supported`,
          executionTime: Date.now() - startTime
        }
    }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    }
  }
}

async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  
  try {
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

    const fn = new Function('console', code)
    const result = fn(customConsole)
    
    let output = logs.join('\n')
    if (result !== undefined) {
      output += `\n\nReturn value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
    }
    
    return {
      output: output || '(No output)',
      error: null,
      executionTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    }
  }
}

async function executeTypeScript(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-ts-'))
  const filePath = path.join(tempDir, 'code.ts')
  
  try {
    await fs.writeFile(filePath, code)
    
    // Check if ts-node is installed
    try {
      await execAsync('which ts-node')
    } catch {
      return {
        output: '',
        error: 'TypeScript execution requires ts-node to be installed globally.\nRun: npm install -g ts-node typescript',
        executionTime: Date.now() - startTime
      }
    }
    
    const { stdout, stderr } = await execAsync(`ts-node ${filePath}`, {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })
    
    return {
      output: stdout || '(No output)',
      error: stderr || null,
      executionTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

async function executePython(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-py-'))
  const filePath = path.join(tempDir, 'code.py')
  
  try {
    await fs.writeFile(filePath, code)
    
    const { stdout, stderr } = await execAsync(`python3 ${filePath}`, {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })
    
    return {
      output: stdout || '(No output)',
      error: stderr || null,
      executionTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

async function executeJava(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-java-'))
  
  try {
    // Extract class name from code
    const classNameMatch = code.match(/public\s+class\s+(\w+)/)
    const className = classNameMatch ? classNameMatch[1] : 'Main'
    const filePath = path.join(tempDir, `${className}.java`)
    
    await fs.writeFile(filePath, code)
    
    // Compile
    await execAsync(`javac ${filePath}`, {
      cwd: tempDir,
      timeout: 5000
    })
    
    // Run
    const { stdout, stderr } = await execAsync(`java ${className}`, {
      cwd: tempDir,
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })
    
    return {
      output: stdout || '(No output)',
      error: stderr || null,
      executionTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

async function executeCpp(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-cpp-'))
  const sourceFile = path.join(tempDir, 'code.cpp')
  const outputFile = path.join(tempDir, 'code.out')
  
  try {
    await fs.writeFile(sourceFile, code)
    
    // Compile
    await execAsync(`g++ -o ${outputFile} ${sourceFile}`, {
      timeout: 5000
    })
    
    // Run
    const { stdout, stderr } = await execAsync(outputFile, {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })
    
    return {
      output: stdout || '(No output)',
      error: stderr || null,
      executionTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

async function executeGo(code: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-go-'))
  const filePath = path.join(tempDir, 'code.go')
  
  try {
    await fs.writeFile(filePath, code)
    
    const { stdout, stderr } = await execAsync(`go run ${filePath}`, {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    })
    
    return {
      output: stdout || '(No output)',
      error: stderr || null,
      executionTime: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      output: error.stdout || '',
      error: error.stderr || error.message,
      executionTime: Date.now() - startTime
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}
