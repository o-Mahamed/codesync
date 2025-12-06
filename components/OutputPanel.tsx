'use client'

interface OutputPanelProps {
  output: string
  isRunning: boolean
  onRun: () => void
  onClear: () => void
  language: string
}

export default function OutputPanel({ output, isRunning, onRun, onClear, language }: OutputPanelProps) {
  // Languages that can be executed
  const executableLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'typescript']
  const canExecute = executableLanguages.includes(language.toLowerCase())

  return (
    <div className="h-64 bg-gray-900 border-t border-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Output</h3>
        {canExecute ? (
          <>
            <button
              onClick={onRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Code
                </>
              )}
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
            >
              Clear
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {language === 'html' || language === 'css' ? 
              'Use Live Preview for HTML/CSS' : 
              `${language} execution not supported - use Live Preview or run locally`
            }
          </div>
        )}
      </div>

      {/* Output content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
          {output || 'Output will appear here...'}
        </pre>
      </div>
    </div>
  )
}