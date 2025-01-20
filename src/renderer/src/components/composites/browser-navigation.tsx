import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrowserNavigationProps } from '../../types/browser'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function BrowserNavigation({
  url,
  onNavigate: onUrlChange,
  onRefresh
}: BrowserNavigationProps) {
  const [inputValue, setInputValue] = useState(url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUrlChange(inputValue)
  }

  useEffect(() => {
    setInputValue(url)
  }, [url])

  return (
    <div className="flex items-center gap-2 border-b p-2">
      <Button variant="ghost" size="icon" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <form onSubmit={handleSubmit} className="flex-1">
        <Input
          type="url"
          placeholder="Enter URL"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </form>
    </div>
  )
}
