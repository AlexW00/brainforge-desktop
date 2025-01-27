import MDEditor from '@uiw/react-md-editor'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { File } from '../../../../types/files'
import { useView } from '../../contexts/ViewContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

function MarkdownPreview({ content, file }: { content: string; file: File }) {
  const { setViewProp, viewId, navigate } = useView<'files'>()
  const { activeViewId } = useWorkspace()
  const dirname = file.path.substring(0, file.path.lastIndexOf('/'))

  // Add keyboard shortcut to exit preview mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'e' && (event.metaKey || event.ctrlKey) && viewId === activeViewId) {
        event.preventDefault()
        setViewProp('isPreview', false, false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewId, activeViewId, setViewProp])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 p-4 bg-background">
        <div className="h-full overflow-auto">
          <div className="prose prose-invert dark:prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({ src, alt, ...props }) => {
                  if (!src) return null
                  // If the src is a relative path, make it absolute
                  const absoluteSrc = src.startsWith('.')
                    ? `file://${dirname}/${src.substring(2)}`
                    : src.startsWith('/')
                      ? `file://${src}`
                      : src
                  return <img src={absoluteSrc} alt={alt} {...props} />
                },
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    onClick={async (e) => {
                      e.preventDefault()
                      if (href) {
                        if (href.endsWith('.md')) {
                          if (href.startsWith('.')) {
                            navigate('files', {
                              path: await window.api.joinPath(dirname, href.substring(2))
                            })
                          } else {
                            navigate('browser', { url: await window.api.joinPath(dirname, href) })
                          }
                        } else {
                          navigate('browser', { url: href })
                        }
                      }
                    }}
                    {...props}
                  >
                    {children}
                  </a>
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const { view, setViewProp, viewId } = useView<'files'>()
  const { activeViewId } = useWorkspace()
  const [content, setContent] = useState<string>('')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    window.api.readFile(file.path).then(setContent)
  }, [file.path, file.lastUpdated])

  const handleChange = (value: string | undefined) => {
    if (value === undefined) return
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

  const togglePreview = () => {
    if (viewId === activeViewId) {
      setViewProp('isPreview', !(view.props?.isPreview ?? false))
    }
  }

  // Add keyboard shortcut to preview mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'e' && (event.metaKey || event.ctrlKey) && viewId === activeViewId) {
        event.preventDefault()
        togglePreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewId, activeViewId, setViewProp, view.props?.isPreview])

  return (
    <div className="flex-1 overflow-hidden min-h-0 relative bg-background">
      {view.props.isPreview ? (
        <MarkdownPreview content={content} file={file} />
      ) : (
        <div className="h-full [&_.wmde-markdown]:bg-background">
          <MDEditor
            value={content}
            onChange={handleChange}
            height="100%"
            preview="edit"
            hideToolbar={true}
            style={
              {
                '--color-canvas-default': 'hsl(var(--background))',
                '--color-canvas-subtle': 'hsl(var(--muted))',
                backgroundColor: 'hsl(var(--background))'
              } as React.CSSProperties
            }
          />
        </div>
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
