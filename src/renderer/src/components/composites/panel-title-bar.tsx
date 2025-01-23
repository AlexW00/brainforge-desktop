import { SplitDirection } from '@devbookhq/splitter'
import { useDraggable } from '@dnd-kit/core'
import {
  ArrowLeft,
  ArrowRight,
  LucideIcon,
  SplitSquareHorizontal,
  SplitSquareVertical,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useView } from '../../contexts/ViewContext'
import { ViewName } from '../../stock/Views'

interface PanelTitleBarProps {
  viewId: string
  name: ViewName
  Icon: LucideIcon
  onSplit: (direction: SplitDirection) => void
  onClose: () => void
  isActive?: boolean
}

export function PanelTitleBar({
  viewId,
  name,
  Icon,
  onSplit,
  onClose,
  isActive
}: PanelTitleBarProps) {
  const { canGoBack, canGoForward, goBack, goForward } = useView()
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [isHoveringIcon, setIsHoveringIcon] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: viewId
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.key === 'Shift') setIsAltPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.key === 'Shift') setIsAltPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="grid grid-cols-3 items-center mb-2 h-6">
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
      <div className="text-sm font-medium flex items-center justify-center">
        <span
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={`flex items-center gap-2 cursor-grab select-none px-2 ${isActive ? 'font-bold' : ''}`}
          style={{
            transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
          }}
        >
          <Icon className="h-4 w-4" />
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </span>
      </div>
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSplit(
              isAltPressed && isHoveringIcon ? SplitDirection.Vertical : SplitDirection.Horizontal
            )
          }}
          onMouseEnter={() => setIsHoveringIcon(true)}
          onMouseLeave={() => setIsHoveringIcon(false)}
          className="hover:bg-muted rounded p-1"
        >
          <SplitSquareHorizontal
            className={`h-4 w-4 ${isAltPressed && isHoveringIcon ? 'hidden' : 'block'}`}
          />
          <SplitSquareVertical
            className={`h-4 w-4 ${isAltPressed && isHoveringIcon ? 'block' : 'hidden'}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="hover:bg-muted rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
