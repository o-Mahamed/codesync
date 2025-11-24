'use client'

import { useState } from 'react'

interface GitPanelProps {
  roomId: string
  code: string
  language: string
}

export default function GitPanel({ roomId, code, language }: GitPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [commitMessage, setCommitMessage] = useState('')
  const [fileName, setFileName] = useState(`code.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'go' ? 'go' : 'txt'}`)
  const [isCommitting, setIsCommitting] = useState(false)
  const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const handleCommit = async () => {
    if (!repoUrl || !commitMessage || !fileName) {
      setStatus({ message: 'Please fill in all fields', type: 'error' })
      return
    }

    setIsCommitting(true)
    setStatus({ message: 'Committing to GitHub...', type: 'info' })

    try {
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          branch,
          fileName,
          code,
          commitMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ message: 'Successfully committed to GitHub!', type: 'success' })
        setCommitMessage('')
      } else {
        setStatus({ message: data.error || 'Failed to commit', type: 'error' })
      }
    } catch (error) {
      setStatus({ message: 'Failed to commit to GitHub', type: 'error' })
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <>
      {/* Git button in top bar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
        title="Commit to GitHub"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span>Git</span>
      </button>

      {/* Git modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Commit to GitHub
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

            {status && (
              <div className={`mb-4 p-3 rounded ${
                status.type === 'success' ? 'bg-green-500/20 border border-green-500 text-green-200' :
                status.type === 'error' ? 'bg-red-500/20 border border-red-500 text-red-200' :
                'bg-blue-500/20 border border-blue-500 text-blue-200'
              }`}>
                {status.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get a token from GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commit Message
                </label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Update code from CodeSync"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCommit}
                disabled={isCommitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
              >
                {isCommitting ? 'Committing...' : 'Commit to GitHub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
