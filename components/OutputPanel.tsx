'use client'

import { useState } from 'react'

interface OutputPanelProps {
  onExecute: () => void
  output: string
  isExecuting: boolean
  error: string | null
}

export default function OutputPanel({ onExecute, output, isExecuting, error }: OutputPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={`bg-gray-900 border-t border-gray-700 flex flex-col transition-all duration-300 ${isExpanded ? 'h-64' : 'h-12'}`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-300">Output</span>
          {error && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
              Error
            </span>
          )}
        </div>
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {isExecuting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Code
            </>
          )}
        </button>
      </div>

      {/* Output content */}
      {isExpanded && (
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {output || '// Click "Run Code" to see output here...'}
          </pre>
        </div>
      )}
    </div>
  )
}
