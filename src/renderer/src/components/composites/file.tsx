import { useEffect, useMemo, useState } from 'react'
import { File } from '../../../../types/files'

interface EditorComponentProps {
  path: string
}

function EditorComponent({ path }: EditorComponentProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    window.api
      .readFile(path)
      .then((dataUrl) => {
        const base64Content = dataUrl.split(',')[1]
        // Convert base64 to bytes
        const binaryString = atob(base64Content)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        // Decode bytes to text using UTF-8
        const decoder = new TextDecoder('utf-8')
        setContent(decoder.decode(bytes))
      })
      .catch((err) => setError(err.message))
  }, [path])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-destructive">
        Error loading file: {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <pre className="p-4 whitespace-pre-wrap break-words">{content}</pre>
    </div>
  )
}

interface ImageComponentProps {
  path: string
  mimeType: string
}

function ImageComponent({ path }: ImageComponentProps) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    window.api
      .readFile(path)
      .then(setDataUrl)
      .catch((err) => setError(err.message))
  }, [path])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-destructive">
        Error loading image: {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <img src={dataUrl} alt={path} className="max-w-full max-h-full object-contain" />
    </div>
  )
}

interface FileComponentProps {
  node: File
}

export function FileComponent({ node }: FileComponentProps) {
  const isImage = useMemo(() => {
    return node.mimeType.startsWith('image/')
  }, [node.mimeType])

  const isText = useMemo(() => {
    return (
      node.mimeType.startsWith('text/') ||
      node.mimeType === 'application/json' ||
      node.mimeType === 'application/javascript' ||
      node.mimeType === 'application/typescript'
    )
  }, [node.mimeType])

  useEffect(() => {
    // Force re-render when lastUpdated changes
  }, [node.lastUpdated])

  if (isImage) {
    return <ImageComponent path={node.path} mimeType={node.mimeType} key={node.lastUpdated} />
  }

  if (isText) {
    return <EditorComponent path={node.path} key={node.lastUpdated} />
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
      Cannot display file of type {node.mimeType}
    </div>
  )
}
