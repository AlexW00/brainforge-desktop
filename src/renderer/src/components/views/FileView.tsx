import { useEffect, useState } from 'react'
import { File } from '../../../../types/files'
import { useFileCache } from '../../contexts/FileCacheContext'
import { useView } from '../../contexts/ViewContext'

interface FileViewerProps {
  file: File
}

function ImageViewer({ file }: FileViewerProps) {
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

function TextViewer({ file }: FileViewerProps) {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    // In a real implementation, we'd want to handle large files properly
    window.api.readFile(file.path).then(setContent)
  }, [file.path])

  return <div className="flex-1 p-4 font-mono text-sm whitespace-pre overflow-auto">{content}</div>
}

function DefaultViewer({ file }: FileViewerProps) {
  return (
    <div className="flex flex-1 items-center justify-center text-muted-foreground">
      No viewer available for this file type ({file.mimeType})
    </div>
  )
}

export function FileView() {
  const { view } = useView<'files'>()
  const { isInitialized, getNode } = useFileCache()
  const currentPath = view.props.path ?? ''
  const currentNode = isInitialized ? getNode(currentPath) : null

  if (!isInitialized || !currentNode || currentNode.type !== 'file') {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        File not found
      </div>
    )
  }

  const file = currentNode as File
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
