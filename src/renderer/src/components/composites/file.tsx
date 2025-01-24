import { useMemo } from 'react'
import { File } from '../../../../types/files'
import { EditorComponent } from './file/editor'
import { ImageComponent } from './file/image'

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

  if (isImage) {
    return <ImageComponent path={node.path} mimeType={node.mimeType} key={node.lastUpdated} />
  }

  if (isText) {
    return <EditorComponent path={node.path} lastUpdated={node.lastUpdated} />
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
      Cannot display file of type {node.mimeType}
    </div>
  )
}
