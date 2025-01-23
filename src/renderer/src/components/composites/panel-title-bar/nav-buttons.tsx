import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useView } from '../../../contexts/ViewContext'

export function PanelNavButtons() {
  const { canGoBack, canGoForward, goBack, goForward } = useView()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation()
          goBack()
        }}
        className="hover:bg-muted rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canGoBack()}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          goForward()
        }}
        className="hover:bg-muted rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canGoForward()}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
