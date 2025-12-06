'use client'

import { useState, useEffect, useRef } from 'react'

interface LivePreviewProps {
  htmlCode: string
  cssCode: string
  jsCode: string
  isVisible: boolean
  onToggle: () => void
}

export default function LivePreview({ htmlCode, cssCode, jsCode, isVisible, onToggle }: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [width, setWidth] = useState(600)
  const [isResizing, setIsResizing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  const resizeRef = useRef<HTMLDivElement>(null)

  const viewportSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto'
  }

  useEffect(() => {
    // Debounce refresh to avoid too many updates
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshPreview()
    }, 500)

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [htmlCode, cssCode, jsCode])

  const hasContent = htmlCode.trim() || cssCode.trim() || jsCode.trim()

  const refreshPreview = () => {
    if (!iframeRef.current) return
    if (!hasContent) return

    setIsRefreshing(true)
    setConsoleOutput([])

    // Create the full HTML document
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script>
    // Capture console output
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = function(...args) {
        window.parent.postMessage({
          type: 'console',
          level: 'log',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
        }, '*');
        originalLog.apply(console, args);
      };

      console.error = function(...args) {
        window.parent.postMessage({
          type: 'console',
          level: 'error',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
        }, '*');
        originalError.apply(console, args);
      };

      console.warn = function(...args) {
        window.parent.postMessage({
          type: 'console',
          level: 'warn',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
        }, '*');
        originalWarn.apply(console, args);
      };

      // Capture errors
      window.addEventListener('error', function(e) {
        window.parent.postMessage({
          type: 'console',
          level: 'error',
          message: e.message + ' at line ' + e.lineno
        }, '*');
      });
    })();

    ${jsCode}
  </script>
</body>
</html>
    `

    // Use srcdoc instead of contentDocument to avoid sandbox issues
    iframeRef.current.srcdoc = fullHTML

    setTimeout(() => setIsRefreshing(false), 300)
  }

  useEffect(() => {
    // Listen for console messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleOutput(prev => [...prev, `[${event.data.level}] ${event.data.message}`])
      }
    }

    // Handle resize
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = window.innerWidth - e.clientX
      setWidth(Math.max(300, Math.min(newWidth, window.innerWidth - 400)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>${jsCode}</script>
</body>
</html>
      `
      newWindow.document.write(fullHTML)
      newWindow.document.close()
    }
  }

  if (!isVisible) return null

  return (
    <div className="bg-gray-800 border-l border-gray-700 flex flex-col relative" style={{ width: `${width}px` }}>
      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
        style={{ marginLeft: '-2px' }}
      />
      
      {/* Header */}
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">Live Preview</h3>
          {isRefreshing && (
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode selector */}
          <div className="flex gap-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1 rounded transition-colors ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Desktop view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-1 rounded transition-colors ${viewMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Tablet view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1 rounded transition-colors ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mobile view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Console toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`p-1 rounded transition-colors ${showConsole ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Toggle console"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Refresh */}
          <button
            onClick={refreshPreview}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Open in new window */}
          <button
            onClick={handleOpenInNewWindow}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Open in new window"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Close preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-auto bg-white">
        {!hasContent ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Preview Available</h3>
              <p className="text-gray-500 text-sm mb-4">Create HTML, CSS, or JavaScript files to see a live preview</p>
              <div className="text-left inline-block bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-600 mb-2">Quick Start:</p>
                <ol className="text-xs text-gray-700 space-y-1">
                  <li>1. Create a file named <code className="bg-white px-1 rounded">index.html</code></li>
                  <li>2. Add some HTML: <code className="bg-white px-1 rounded">&lt;h1&gt;Hello!&lt;/h1&gt;</code></li>
                  <li>3. Preview will appear automatically!</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${viewportSizes[viewMode]} h-full transition-all duration-300`}>
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
              title="Live Preview"
            />
          </div>
        )}
      </div>

      {/* Console */}
      {showConsole && (
        <div className="h-48 bg-gray-900 border-t border-gray-700 flex flex-col">
          <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white text-sm font-semibold">Console</span>
            <button
              onClick={() => setConsoleOutput([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
            {consoleOutput.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No console output</div>
            ) : (
              consoleOutput.map((line, i) => (
                <div
                  key={i}
                  className={`py-1 ${
                    line.includes('[error]') ? 'text-red-400' :
                    line.includes('[warn]') ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}