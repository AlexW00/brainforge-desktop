import { useEffect, useState } from 'react'

interface EditorComponentProps {
  path: string
}

export function EditorComponent({ path }: EditorComponentProps) {
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
