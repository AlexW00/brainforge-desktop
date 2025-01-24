import { useMemo } from 'react'
import { FileSystemNode } from '../../../../types/files'

interface EditorComponentProps {
  path: string
  mimeType: string
}

function EditorComponent({ path, mimeType }: EditorComponentProps) {
  return (
    <div className="flex-1 overflow-auto">
      {/* TODO: Implement text editor */}
      <pre className="p-4">
        Text editor for {path} ({mimeType})
      </pre>
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
    return <EditorComponent path={node.path} mimeType={node.mimeType} />
  }

  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      Cannot display file of type {node.mimeType}
    </div>
  )
}
