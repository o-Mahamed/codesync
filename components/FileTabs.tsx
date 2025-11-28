'use client'

import { FileData } from './FileManager'

interface FileTabsProps {
  files: FileData[]
  activeFileId: string
  onFileSelect: (fileId: string) => void
  onFileClose: (fileId: string) => void
}

export default function FileTabs({ files, activeFileId, onFileSelect, onFileClose }: FileTabsProps) {
  const getLanguageIcon = (language: string) => {
    const colors: { [key: string]: string } = {
      'javascript': 'text-yellow-400',
      'typescript': 'text-blue-400',
      'python': 'text-blue-300',
      'java': 'text-orange-400',
      'cpp': 'text-purple-400',
      'c': 'text-purple-300',
      'csharp': 'text-green-400',
      'go': 'text-cyan-400',
      'rust': 'text-orange-300',
      'ruby': 'text-red-400',
      'php': 'text-indigo-400',
      'swift': 'text-orange-400',
      'kotlin': 'text-purple-400',
      'html': 'text-orange-500',
      'css': 'text-blue-500',
    }
    return colors[language] || 'text-gray-400'
  }

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => onFileSelect(file.id)}
          className={`group flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-gray-700 min-w-0 transition-colors ${
            activeFileId === file.id
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
          }`}
        >
          <svg 
            className={`w-4 h-4 flex-shrink-0 ${getLanguageIcon(file.language)}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm truncate max-w-[120px]">{file.name}</span>
          
          {files.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFileClose(file.id)
              }}
              className={`ml-1 p-0.5 rounded hover:bg-gray-600 transition-colors ${
                activeFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Close file"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}