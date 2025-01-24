import { useEffect, useMemo, useState } from 'react'
import { FileSystemNode } from '../../../../types/files'

interface EditorComponentProps {
  path: string
}

function EditorComponent({ path }: EditorComponentProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    window.api
      .getFileContent(path)
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [path])

  if (error) {
    return (
      <div className="flex-1 overflow-auto flex items-center justify-center text-destructive">
        Error loading file: {error}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <pre className="p-4">{content}</pre>
    </div>
  )
}

interface ImageComponentProps {
  path: string
  mimeType: string
}

function ImageComponent({ path }: ImageComponentProps) {
  return (
    <div className="flex-1 overflow-auto flex items-center justify-center">
      <img src={`file://${path}`} alt={path} className="max-w-full max-h-full" />
    </div>
  )
}

interface FileComponentProps {
  node: FileSystemNode
}

export function FileComponent({ node }: FileComponentProps) {
  const isImage = useMemo(() => {
    return node.type === 'file' && node.mimeType.startsWith('image/')
  }, [node])

  const isText = useMemo(() => {
    return (
      node.type === 'file' &&
      (node.mimeType.startsWith('text/') ||
        node.mimeType === 'application/json' ||
        node.mimeType === 'application/javascript' ||
        node.mimeType === 'application/typescript')
    )
  }, [node])

  if (node.type !== 'file') {
    return null
  }

  if (isImage) {
    return <ImageComponent path={node.path} mimeType={node.mimeType} />
  }

  if (isText) {
    return <EditorComponent path={node.path} />
  }

  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      Cannot display file of type {node.mimeType}
    </div>
  )
}
