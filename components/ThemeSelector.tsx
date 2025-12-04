'use client'

import { useState, useEffect, useRef } from 'react'

export interface Theme {
  id: string
  name: string
  editorTheme: string
  background: string
  preview: {
    bg: string
    text: string
    accent: string
  }
}

const themes: Theme[] = [
  {
    id: 'vs-dark',
    name: 'VS Dark',
    editorTheme: 'vs-dark',
    background: 'bg-gray-900',
    preview: { bg: '#1e1e1e', text: '#d4d4d4', accent: '#569cd6' }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    editorTheme: 'github-dark',
    background: 'bg-[#0d1117]',
    preview: { bg: '#0d1117', text: '#c9d1d9', accent: '#58a6ff' }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    editorTheme: 'dracula',
    background: 'bg-[#282a36]',
    preview: { bg: '#282a36', text: '#f8f8f2', accent: '#ff79c6' }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    editorTheme: 'monokai',
    background: 'bg-[#272822]',
    preview: { bg: '#272822', text: '#f8f8f2', accent: '#66d9ef' }
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    editorTheme: 'night-owl',
    background: 'bg-[#011627]',
    preview: { bg: '#011627', text: '#d6deeb', accent: '#7fdbca' }
  },
  {
    id: 'nord',
    name: 'Nord',
    editorTheme: 'nord',
    background: 'bg-[#2e3440]',
    preview: { bg: '#2e3440', text: '#eceff4', accent: '#88c0d0' }
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    editorTheme: 'one-dark-pro',
    background: 'bg-[#282c34]',
    preview: { bg: '#282c34', text: '#abb2bf', accent: '#61afef' }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    editorTheme: 'solarized-dark',
    background: 'bg-[#002b36]',
    preview: { bg: '#002b36', text: '#839496', accent: '#268bd2' }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    editorTheme: 'github-light',
    background: 'bg-white',
    preview: { bg: '#ffffff', text: '#24292f', accent: '#0969da' }
  },
  {
    id: 'vs-light',
    name: 'VS Light',
    editorTheme: 'vs',
    background: 'bg-white',
    preview: { bg: '#ffffff', text: '#000000', accent: '#0000ff' }
  },
]

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (theme: Theme) => void
}

export default function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTheme = themes.find(t => t.id === currentTheme) || themes[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
        title="Change theme"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span>{selectedTheme.name}</span>
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
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-80 max-h-[500px] overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 font-semibold">
              Editor Themes
            </div>

            {/* Dark Themes */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 px-3 py-1 font-medium">Dark Themes</div>
              {themes.filter(t => t.id !== 'github-light' && t.id !== 'vs-light').map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    currentTheme === theme.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Theme preview */}
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.bg }}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.text }}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                      </div>
                      <span>{theme.name}</span>
                    </div>
                    {currentTheme === theme.id && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Light Themes */}
            <div>
              <div className="text-xs text-gray-500 px-3 py-1 font-medium">Light Themes</div>
              {themes.filter(t => t.id === 'github-light' || t.id === 'vs-light').map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    currentTheme === theme.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Theme preview */}
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.bg }}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.text }}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                      </div>
                      <span>{theme.name}</span>
                    </div>
                    {currentTheme === theme.id && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}