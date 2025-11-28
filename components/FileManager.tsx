'use client'

import { useState } from 'react'

export interface FileData {
  id: string
  name: string
  language: string
  code: string
}

interface FileManagerProps {
  files: FileData[]
  activeFileId: string
  onFileSelect: (fileId: string) => void
  onFileCreate: (name: string, language: string) => void
  onFileRename: (fileId: string, newName: string) => void
  onFileDelete: (fileId: string) => void
}

export default function FileManager({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete
}: FileManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const getLanguageFromFileName = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase()
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'css': 'css',
    }
    return langMap[ext || ''] || 'javascript'
  }

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const language = getLanguageFromFileName(newFileName)
      onFileCreate(newFileName.trim(), language)
      setNewFileName('')
      setIsCreating(false)
    }
  }

  const handleRename = (fileId: string) => {
    if (editingName.trim()) {
      onFileRename(fileId, editingName.trim())
      setEditingFileId(null)
      setEditingName('')
    }
  }

  const handleDelete = (fileId: string) => {
    onFileDelete(fileId)
    setShowDeleteConfirm(null)
  }

  const startRename = (file: FileData) => {
    setEditingFileId(file.id)
    setEditingName(file.name)
  }

  return (
    <div className="h-full bg-gray-900 border-r border-gray-700 flex flex-col w-64">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Files</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          title="New file"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {/* New file input */}
        {isCreating && (
          <div className="p-2 bg-gray-800">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewFileName('')
                }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.js"
              className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Files */}
        {files.map((file) => (
          <div
            key={file.id}
            className={`group relative ${
              activeFileId === file.id ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            {editingFileId === file.id ? (
              <div className="p-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(file.id)
                    if (e.key === 'Escape') {
                      setEditingFileId(null)
                      setEditingName('')
                    }
                  }}
                  onBlur={() => handleRename(file.id)}
                  className="w-full px-2 py-1 bg-gray-700 text-white text-sm rounded border border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <div
                onClick={() => onFileSelect(file.id)}
                className="flex items-center justify-between p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-white text-sm truncate">{file.name}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startRename(file)
                    }}
                    className="p-1 hover:bg-gray-600 rounded transition-colors text-gray-400 hover:text-white"
                    title="Rename"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(file.id)
                      }}
                      className="p-1 hover:bg-red-600 rounded transition-colors text-gray-400 hover:text-white"
                      title="Delete"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm === file.id && (
              <div className="absolute inset-0 bg-gray-800 border border-red-500 flex items-center justify-center gap-2 p-2 z-10">
                <button
                  onClick={() => handleDelete(file.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}

        {files.length === 0 && !isCreating && (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">No files yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              Create your first file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}