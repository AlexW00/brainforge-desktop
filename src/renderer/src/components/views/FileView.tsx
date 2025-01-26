import { markdown } from '@codemirror/lang-markdown'
import { EditorSelection } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { githubDark } from '@fsegurai/codemirror-theme-bundle'
import CodeMirror from '@uiw/react-codemirror'
import { basicSetup } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { File } from '../../../../types/files'

// Define markdown shortcuts
const markdownKeymap = keymap.of([
  {
    key: 'Mod-b',
    run: (view) => {
      const selection = view.state.selection.main
      const text = view.state.doc.sliceString(selection.from, selection.to)
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text ? `**${text}**` : '****'
        },
        selection: text ? undefined : EditorSelection.cursor(selection.from + 2)
      })
      return true
    }
  },
  {
    key: 'Mod-i',
    run: (view) => {
      const selection = view.state.selection.main
      const text = view.state.doc.sliceString(selection.from, selection.to)
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text ? `_${text}_` : '__'
        },
        selection: text ? undefined : EditorSelection.cursor(selection.from + 1)
      })
      return true
    }
  },
  {
    key: 'Mod-`',
    run: (view) => {
      const selection = view.state.selection.main
      const text = view.state.doc.sliceString(selection.from, selection.to)
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: text ? `\`${text}\`` : '``'
        },
        selection: text ? undefined : EditorSelection.cursor(selection.from + 1)
      })
      return true
    }
  }
])

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

function TextViewer({ file }: FileViewProps) {
  const [content, setContent] = useState<string>('')
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
        await window.api.writeFile(file.path, value)
      } catch (error) {
        console.error('Failed to save file:', error)
        // TODO: Show error toast
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
    <div className="flex-1 overflow-hidden min-h-0 relative bg-background">
      <CodeMirror
        value={content}
        height="100%"
        onChange={handleChange}
        extensions={[basicSetup, markdown(), EditorView.lineWrapping, githubDark, markdownKeymap]}
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
          highlightSelectionMatches: false
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!font-mono [&_.cm-content]:!py-4 [&_.cm-content]:!px-4 [&_.cm-scroller]:!overflow-auto [&_.cm-line]:!break-words [&_.cm-editor]:bg-background [&_.cm-gutters]:!hidden [&_.cm-activeLine]:!bg-transparent"
      />
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
