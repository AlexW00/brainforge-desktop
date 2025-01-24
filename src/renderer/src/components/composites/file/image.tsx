import { useEffect, useState } from 'react'

interface ImageComponentProps {
  path: string
  mimeType: string
}

export function ImageComponent({ path }: ImageComponentProps) {
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
