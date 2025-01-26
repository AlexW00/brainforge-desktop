import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useRef, useState } from 'react'
import { File } from '../../../../types/files'

interface FileViewProps {
  file: File
}

function ImageViewer({ file }: FileViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <img
        src={`file://${file.path}`}
        alt={file.path.split('/').pop()}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  )
}

// Create a custom theme that matches shadcn aesthetic
const customTheme = EditorView.theme({
  '&': {
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))'
  },
  '.cm-content': {
    caretColor: 'hsl(var(--primary))',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%'
  },
  '.cm-line': {
    width: '100%'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'hsl(var(--primary))'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'hsl(var(--muted) / 0.4)'
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent'
  },
  '.cm-gutters': {
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--muted-foreground))',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent'
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    overflow: 'auto !important'
  }
})

function TextViewer({ file }: FileViewProps) {
  const [content, setContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    window.api.readFile(file.path).then(setContent)
  }, [file.path, file.lastUpdated])

  const handleChange = (value: string) => {
    setContent(value)

    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new save timeout (autosave after 500ms of no typing)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await window.api.writeFile(file.path, value)
      } catch (error) {
        console.error('Failed to save file:', error)
        // TODO: Show error toast
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="flex-1 overflow-hidden min-h-0 relative">
      <CodeMirror
        value={content}
        height="100%"
        theme="dark"
        onChange={handleChange}
        extensions={[markdown(), customTheme, EditorView.lineWrapping]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          highlightActiveLineGutter: false
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!font-mono [&_.cm-content]:!py-4 [&_.cm-content]:!px-4 [&_.cm-scroller]:!overflow-auto [&_.cm-line]:!break-words"
      />
      {isSaving && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">Saving...</div>
      )}
    </div>
  )
}

function DefaultViewer({ file }: FileViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center text-muted-foreground">
      No viewer available for this file type ({file.mimeType})
    </div>
  )
}

export function FileView({ file }: FileViewProps) {
  const mimeType = file.mimeType.toLowerCase()

  // Check if it's an image
  if (mimeType.startsWith('image/')) {
    return <ImageViewer file={file} />
  }

  // Check if it's text
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml'
  ) {
    return <TextViewer file={file} />
  }

  return <DefaultViewer file={file} />
}
