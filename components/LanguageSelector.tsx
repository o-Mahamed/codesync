'use client'

import { useState, useRef, useEffect } from 'react'

interface LanguageSelectorProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
}

const languages = [
  { id: 'javascript', name: 'JavaScript', color: 'text-yellow-400' },
  { id: 'typescript', name: 'TypeScript', color: 'text-blue-400' },
  { id: 'python', name: 'Python', color: 'text-blue-300' },
  { id: 'java', name: 'Java', color: 'text-orange-400' },
  { id: 'cpp', name: 'C++', color: 'text-purple-400' },
  { id: 'c', name: 'C', color: 'text-purple-300' },
  { id: 'csharp', name: 'C#', color: 'text-green-400' },
  { id: 'go', name: 'Go', color: 'text-cyan-400' },
  { id: 'rust', name: 'Rust', color: 'text-orange-300' },
  { id: 'ruby', name: 'Ruby', color: 'text-red-400' },
  { id: 'php', name: 'PHP', color: 'text-indigo-400' },
  { id: 'swift', name: 'Swift', color: 'text-orange-400' },
  { id: 'kotlin', name: 'Kotlin', color: 'text-purple-400' },
  { id: 'html', name: 'HTML', color: 'text-orange-500' },
  { id: 'css', name: 'CSS', color: 'text-blue-500' },
]

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(lang => lang.id === currentLanguage) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = (languageId: string) => {
    onLanguageChange(languageId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <span className={currentLang.color}>{currentLang.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 font-semibold">
              Select Language
            </div>
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  currentLanguage === lang.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={lang.id === currentLanguage ? 'text-white' : lang.color}>
                    {lang.name}
                  </span>
                  {currentLanguage === lang.id && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}