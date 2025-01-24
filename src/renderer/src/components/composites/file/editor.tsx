import { debounce } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MarkdownEditor } from '../../ui/markdown-editor'

interface EditorComponentProps {
  path: string
  lastUpdated: number
}

export function EditorComponent({ path, lastUpdated }: EditorComponentProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedContent = useRef<string>('')

  // Load file content
  const loadContent = useCallback(async () => {
    try {
      const dataUrl = await window.api.readFile(path)
      const base64Content = dataUrl.split(',')[1]
      const binaryString = atob(base64Content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const decoder = new TextDecoder('utf-8')
      const newContent = decoder.decode(bytes)

      // Only update if content actually changed
      if (newContent !== lastSavedContent.current) {
        setContent(newContent)
        lastSavedContent.current = newContent
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    }
  }, [path])

  // Initial load
  useEffect(() => {
    loadContent()
  }, [loadContent])

  // Reload when lastUpdated changes
  useEffect(() => {
    loadContent()
  }, [lastUpdated, loadContent])

  // Auto-save functionality
  const saveContent = useCallback(
    debounce(async (markdown: string) => {
      try {
        await window.api.writeFile(path, markdown)
        lastSavedContent.current = markdown
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save file')
      }
    }, 1000),
    [path]
  )

  const handleChange = useCallback(
    (markdown: string) => {
      if (markdown !== lastSavedContent.current) {
        saveContent(markdown)
      }
    },
    [saveContent]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-destructive">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <MarkdownEditor content={content} onChange={handleChange} className="flex-1" />
    </div>
  )
}
