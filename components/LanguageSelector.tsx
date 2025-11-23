'use client'

import { useState, useRef, useEffect } from 'react'

interface LanguageSelectorProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨', color: 'text-yellow-400' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷', color: 'text-blue-400' },
  { value: 'python', label: 'Python', icon: '🐍', color: 'text-green-400' },
  { value: 'java', label: 'Java', icon: '☕', color: 'text-orange-400' },
  { value: 'cpp', label: 'C++', icon: '⚙️', color: 'text-purple-400' },
  { value: 'go', label: 'Go', icon: '🔵', color: 'text-cyan-400' },
]

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find(lang => lang.value === currentLanguage) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = (lang: typeof LANGUAGES[0]) => {
    onLanguageChange(lang.value)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-all border border-gray-600 hover:border-gray-500"
      >
        <span className="text-lg">{currentLang.icon}</span>
        <span className={`font-medium ${currentLang.color}`}>{currentLang.label}</span>
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
        <div className="absolute top-full mt-2 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[200px] z-50">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => handleLanguageSelect(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                currentLanguage === lang.value
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <span className="text-xl">{lang.icon}</span>
              <div className="flex-1">
                <span className={`font-medium ${currentLanguage === lang.value ? 'text-white' : lang.color}`}>
                  {lang.label}
                </span>
              </div>
              {currentLanguage === lang.value && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
