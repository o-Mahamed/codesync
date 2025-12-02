'use client'

import { useState } from 'react'

interface AIAssistantProps {
  code: string
  language: string
  onCodeUpdate: (code: string) => void
}

export default function AIAssistant({ code, language, onCodeUpdate }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'explain' | 'improve' | 'debug' | 'custom'>('explain')

  const quickPrompts = {
    explain: "Explain what this code does in simple terms",
    improve: "Suggest improvements and optimizations for this code",
    debug: "Help me debug this code and find potential issues",
    custom: ""
  }

  const handleSubmit = async () => {
    if (!prompt.trim() && mode !== 'custom') {
      setPrompt(quickPrompts[mode])
    }

    const finalPrompt = mode === 'custom' ? prompt : quickPrompts[mode]
    
    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          prompt: finalPrompt
        })
      })

      const data = await res.json()

      if (res.ok) {
        setResponse(data.response)
        
        // If AI suggests code replacement, offer to apply it
        if (data.suggestedCode && mode !== 'explain') {
          setResponse(data.response + '\n\n💡 Code suggestion available - click "Apply Code" to use it.')
        }
      } else {
        setResponse(`Error: ${data.error || 'Failed to get AI response'}`)
      }
    } catch (error) {
      setResponse('Error: Failed to connect to AI service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyCode = async () => {
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          prompt: mode === 'improve' ? quickPrompts.improve : quickPrompts.debug
        })
      })

      const data = await res.json()

      if (res.ok && data.suggestedCode) {
        onCodeUpdate(data.suggestedCode)
        setResponse('✅ Code updated successfully!')
      }
    } catch (error) {
      setResponse('Error: Failed to apply code changes')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* AI Assistant Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
        title="AI Assistant"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>AI</span>
      </button>

      {/* AI Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Code Assistant
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What would you like help with?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('explain')}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    mode === 'explain'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">📖 Explain Code</div>
                  <div className="text-xs mt-1 opacity-80">Understand what the code does</div>
                </button>
                <button
                  onClick={() => setMode('improve')}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    mode === 'improve'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">✨ Improve Code</div>
                  <div className="text-xs mt-1 opacity-80">Get optimization suggestions</div>
                </button>
                <button
                  onClick={() => setMode('debug')}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    mode === 'debug'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">🐛 Debug</div>
                  <div className="text-xs mt-1 opacity-80">Find and fix issues</div>
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    mode === 'custom'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">💬 Custom Question</div>
                  <div className="text-xs mt-1 opacity-80">Ask anything</div>
                </button>
              </div>
            </div>

            {/* Custom Prompt Input */}
            {mode === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Question
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask anything about your code..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || (mode === 'custom' && !prompt.trim())}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 rounded font-medium transition-colors mb-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Ask AI
                </>
              )}
            </button>

            {/* Response */}
            {response && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-300">AI Response</h3>
                  {mode !== 'explain' && response.includes('💡') && (
                    <button
                      onClick={handleApplyCode}
                      disabled={isLoading}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      Apply Code
                    </button>
                  )}
                </div>
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                  {response}
                </pre>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              Powered by Claude AI • Free tier: $10/month usage
            </div>
          </div>
        </div>
      )}
    </>
  )
}