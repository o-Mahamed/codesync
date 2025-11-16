'use client'

import { useState } from 'react'
import MonacoEditor from '@monaco-editor/react'

export default function Editor({ initialCode, language }: { initialCode: string, language: string }) {
  const [code, setCode] = useState(initialCode)

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || '')}
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        automaticLayout: true,
      }}
    />
  )
}
