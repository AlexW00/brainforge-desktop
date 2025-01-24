import { debounce } from '@/lib/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MarkdownEditor } from '../../ui/markdown-editor'

interface EditorComponentProps {
  path: string
  lastUpdated: number
}

// Function to strip YAML frontmatter from markdown content
const stripYamlFrontmatter = (content: string): string => {
  const match = content.match(/^---\n[\s\S]*?\n---\n/)
  return match ? content.slice(match[0].length) : content
}

export function EditorComponent({ path, lastUpdated }: EditorComponentProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedContent = useRef<string>('')
  const rawContent = useRef<string>('')

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
        rawContent.current = newContent
        const strippedContent = stripYamlFrontmatter(newContent)
        setContent(strippedContent)
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
        // Preserve the YAML frontmatter if it existed
        const match = rawContent.current.match(/^---\n[\s\S]*?\n---\n/)
        const contentToSave = match ? `${match[0]}${markdown}` : markdown
        await window.api.writeFile(path, contentToSave)
        lastSavedContent.current = contentToSave
        rawContent.current = contentToSave
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save file')
      }
    }, 1000),
    [path]
  )

  const handleChange = useCallback(
    (markdown: string) => {
      const match = rawContent.current.match(/^---\n[\s\S]*?\n---\n/)
      const contentToCompare = match ? `${match[0]}${markdown}` : markdown
      if (contentToCompare !== lastSavedContent.current) {
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
